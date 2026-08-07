/**
 * __tests__/integration/xpFlow.test.js
 *
 * Integration tests for the full XP flow:
 *   action → XP event recorded → total_xp updated → rank recalculated
 *   → badge checked → tier crossed → "Almost There" nudge condition
 *
 * ⚠️  Requires a running local Supabase instance.
 *     Start it with: npx supabase start
 *     Then run: npx vitest run src/.../integration/xpFlow.test.js
 *
 * Each test runs in isolation via per-test user IDs and full teardown.
 *
 * Covers:
 *   ✓ New XP event is stored in xp_events and total_xp is incremented
 *   ✓ Duplicate event ID does not double-count XP
 *   ✓ Concurrent identical events — exactly one XP grant succeeds
 *   ✓ total_xp update is reflected in the rank RPC
 *   ✓ XP crossing 1,000 triggers milestone-maker badge via award-badge fn
 *   ✓ XP crossing tier boundary (500 → Farmer) is detectable client-side
 *   ✓ xpGapToNextRank returns ≤ 10 when user is close to next rank
 *   ✓ Full action chain: scan → XP grant → badge check → result returned
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";

// These imports resolve to the real utilities under test
import { processXPEvent, xpGapToNextRank, computeRank } from "../../utils/xpEventProcessor";
import { getTierForXP, getXPToNextTier }                from "../../utils/tierUtils";

// Integration helpers
import {
  testSupabase,
  seedUserProfile,
  cleanupTestData,
} from "../helpers/testFactories";

// ─── Test state ────────────────────────────────────────────────────────────────

let testUserIds = [];

function registerUser(userId) {
  testUserIds.push(userId);
  return userId;
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Verify local Supabase is reachable before running any test
  const { error } = await testSupabase.from("user_profiles").select("user_id").limit(1);
  if (error) {
    throw new Error(
      `[xpFlow.test] Cannot connect to test Supabase at ${process.env.SUPABASE_TEST_URL}.\n` +
      `Run 'npx supabase start' and ensure .env.test is configured.\nSupabase error: ${error.message}`,
    );
  }
});

afterAll(async () => {
  await cleanupTestData();
});

beforeEach(() => {
  testUserIds = [];
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function createUser(xpOverride = 0) {
  const userId = registerUser(`test-user-${uuidv4()}`);
  await seedUserProfile({ user_id: userId, total_xp: xpOverride });
  return userId;
}

async function getUserXP(userId) {
  const { data } = await testSupabase
    .from("user_profiles")
    .select("total_xp")
    .eq("user_id", userId)
    .single();
  return data?.total_xp ?? 0;
}

async function getLeaderboard(userIds) {
  const { data } = await testSupabase
    .from("user_profiles")
    .select("user_id, total_xp")
    .in("user_id", userIds)
    .order("total_xp", { ascending: false });
  return (data ?? []).map((r) => ({ userId: r.user_id, xp: r.total_xp }));
}

// ─── XP event storage ─────────────────────────────────────────────────────────

describe("XP event → DB update", () => {

  it("stores the event in xp_events and increments total_xp", async () => {
    const userId  = await createUser(0);
    const eventId = uuidv4();

    const result = await processXPEvent(testSupabase, {
      eventId,
      userId,
      action:   "scan",
      xpAmount: 10,
    });

    expect(result.skipped).toBe(false);
    expect(result.xpGranted).toBe(10);

    // Verify DB state
    const xp = await getUserXP(userId);
    expect(xp).toBe(10);

    // Verify event is recorded
    const { data: evtRow } = await testSupabase
      .from("xp_events")
      .select("id, xp_amount")
      .eq("id", eventId)
      .single();

    expect(evtRow?.id).toBe(eventId);
    expect(evtRow?.xp_amount).toBe(10);
  });

  it("does NOT double-count XP when the same eventId is sent twice", async () => {
    const userId  = await createUser(0);
    const eventId = uuidv4();
    const payload = { eventId, userId, action: "scan", xpAmount: 10 };

    const r1 = await processXPEvent(testSupabase, payload);
    const r2 = await processXPEvent(testSupabase, payload); // duplicate

    expect(r1.skipped).toBe(false);
    expect(r2.skipped).toBe(true);
    expect(r2.reason).toBe("duplicate_event");

    const finalXP = await getUserXP(userId);
    expect(finalXP).toBe(10); // NOT 20
  });

  it("accumulates XP across multiple unique events", async () => {
    const userId = await createUser(0);

    await processXPEvent(testSupabase, { eventId: uuidv4(), userId, action: "scan",        xpAmount: 10 });
    await processXPEvent(testSupabase, { eventId: uuidv4(), userId, action: "market_view", xpAmount: 2  });
    await processXPEvent(testSupabase, { eventId: uuidv4(), userId, action: "article_read",xpAmount: 5  });

    const finalXP = await getUserXP(userId);
    expect(finalXP).toBe(17);
  });

});

// ─── Concurrent XP events ─────────────────────────────────────────────────────

describe("Concurrent XP events — race condition safety", () => {

  it("only grants XP once when the same eventId fires concurrently", async () => {
    const userId  = await createUser(0);
    const eventId = uuidv4();
    const payload = { eventId, userId, action: "scan", xpAmount: 10 };

    // Fire both at exactly the same time
    const [r1, r2] = await Promise.all([
      processXPEvent(testSupabase, payload),
      processXPEvent(testSupabase, payload),
    ]);

    const granted = [r1, r2].filter((r) => !r.skipped).length;
    expect(granted).toBe(1); // exactly one wins

    const finalXP = await getUserXP(userId);
    expect(finalXP).toBe(10); // NOT 20
  });

});

// ─── Leaderboard rank ─────────────────────────────────────────────────────────

describe("XP update → leaderboard rank change", () => {

  it("correctly reflects XP increase in leaderboard rank", async () => {
    const u1 = await createUser(1000);  // currently rank 1
    const u2 = await createUser(500);   // currently rank 2
    const u3 = await createUser(100);   // currently rank 3

    // Before: u3 is rank 3
    const before = await getLeaderboard([u1, u2, u3]);
    expect(computeRank(before, u3)).toBe(3);

    // u3 earns 600 XP → total = 700, should jump to rank 2
    await processXPEvent(testSupabase, {
      eventId: uuidv4(), userId: u3, action: "sale_completed", xpAmount: 600,
    });

    const after = await getLeaderboard([u1, u2, u3]);
    expect(computeRank(after, u3)).toBe(2);
    expect(computeRank(after, u2)).toBe(3);
  });

  it("get_rank_xp_gap RPC returns the correct gap", async () => {
    const u1 = await createUser(1000);
    const u2 = await createUser(992);  // 8 XP behind → should trigger "Almost There"

    const { data: gapData } = await testSupabase
      .rpc("get_rank_xp_gap", { p_user_id: u2 });

    expect(gapData).toBeDefined();
    expect(gapData[0].xp_gap).toBe(8);
    expect(gapData[0].xp_gap).toBeLessThanOrEqual(10); // "Almost There" condition
  });

  it("get_rank_xp_gap returns 0 for the top-ranked user", async () => {
    const top = await createUser(9999);
    await createUser(8000); // a second user below

    const { data: gapData } = await testSupabase
      .rpc("get_rank_xp_gap", { p_user_id: top });

    expect(gapData[0].xp_gap).toBe(0);
  });

});

// ─── Tier detection ───────────────────────────────────────────────────────────

describe("XP update → tier boundary detection", () => {

  it("correctly detects tier crossing after XP grant", async () => {
    const userId = await createUser(480); // still Seedling (< 500)
    expect(getTierForXP(480).id).toBe("seedling");

    // Grant XP that crosses into Farmer tier
    await processXPEvent(testSupabase, {
      eventId: uuidv4(), userId, action: "sale_completed", xpAmount: 30, // total = 510
    });

    const newXP    = await getUserXP(userId);
    const newTier  = getTierForXP(newXP);

    expect(newXP).toBe(510);
    expect(newTier.id).toBe("farmer");
  });

  it("detects 'Almost There' tier nudge when close to next tier boundary", async () => {
    const xp       = 460;  // 40 XP from Farmer (500)
    const toNext   = getXPToNextTier(xp);
    const TIER_THRESHOLD = 50;

    expect(toNext).toBe(40);
    expect(toNext).toBeLessThanOrEqual(TIER_THRESHOLD);
    // This is the condition useAlmostThere checks
  });

});

// ─── Full action chain ────────────────────────────────────────────────────────

describe("Full action chain: action → XP → badge check", () => {

  it("scan action grants 10 XP and returns correct event metadata", async () => {
    const userId = await createUser(0);
    const result = await processXPEvent(testSupabase, {
      eventId:  uuidv4(),
      userId,
      action:   "scan",
      xpAmount: 10,
      metadata: { cropType: "wheat" },
    });

    expect(result.skipped).toBe(false);
    expect(result.xpGranted).toBe(10);

    const xp = await getUserXP(userId);
    expect(xp).toBe(10);
  });

  it("XP crossing 1,000 triggers milestone-maker via award-badge Edge Function", async () => {
    // Seed user at 990 XP (10 away from milestone)
    const userId = await createUser(990);

    // Grant 15 XP to cross the threshold
    await processXPEvent(testSupabase, {
      eventId: uuidv4(), userId, action: "harvest_logged", xpAmount: 15,
    });

    const newXP = await getUserXP(userId);
    expect(newXP).toBe(1005);
    expect(newXP).toBeGreaterThanOrEqual(1000);

    // Invoke the award-badge Edge Function to check milestone-maker
    const { data, error } = await testSupabase.functions.invoke("award-badge", {
      body: { userId, action: "xp_milestone" },
    });

    expect(error).toBeNull();
    // milestone-maker should be in the awarded list
    const awardedSlugs = (data?.awarded ?? []).map((b) => b.slug);
    expect(awardedSlugs).toContain("milestone-maker");

    // Calling again should NOT re-award (idempotent)
    const { data: data2 } = await testSupabase.functions.invoke("award-badge", {
      body: { userId, action: "xp_milestone" },
    });
    expect(data2?.awarded ?? []).toHaveLength(0);
  });

});
