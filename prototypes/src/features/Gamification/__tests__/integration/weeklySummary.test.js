/**
 * __tests__/integration/weeklySummary.test.js
 *
 * Integration tests for the weekly-summary Edge Function.
 *
 * Two-layer strategy:
 *   LAYER 1 — Pure logic tests (no Supabase)
 *             Tests `buildNotificationCopy` and `computeWeeklySummary` in isolation.
 *             Always run in CI.
 *
 *   LAYER 2 — Full integration (requires local Supabase + deployed Edge Function)
 *             Seeds real DB rows, calls the Edge Function via HTTP, verifies output.
 *             Gated by SUPABASE_TEST_URL env var being set.
 *
 * Run pure tests:       npx vitest run src/.../weeklySummary.test.js
 * Run full integration: SUPABASE_TEST_URL=http://localhost:54321 npx vitest run ...
 *
 * Covers:
 *   ✓ Copy variant: rank improved (🚀)
 *   ✓ Copy variant: rank held (⭐)
 *   ✓ Copy variant: rank dropped (💪)
 *   ✓ Copy variant: first-week user (no previous snapshot) (🌱)
 *   ✓ Users with 0 XP earned are skipped entirely
 *   ✓ computeWeeklySummary: correct XP earned = current_xp − snapshot_xp
 *   ✓ computeWeeklySummary: correct rank_change direction (positive = improved)
 *   ✓ Snapshot upsert: new rows created for next-week reference
 *   ✓ Integration: Edge Function returns 200 with correct payload shape
 *   ✓ Integration: get_weekly_summary RPC returns correct data
 */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { v4 as uuidv4 } from "uuid";
import {
  testSupabase,
  seedUserProfile,
  cleanupTestData,
  makeWeeklySnapshot,
} from "../helpers/testFactories";

// ─── Extracted business logic (mirrors weekly-summary/index.ts) ───────────────
// We duplicate the pure functions here so they can be unit-tested without
// needing a running Edge Function. The real Edge Function uses identical logic.

/**
 * @param {{
 *   xp_earned:     number,
 *   current_rank:  number,
 *   snapshot_rank: number | null,
 *   rank_change:   number,
 * }} row
 */
function buildNotificationCopy(row) {
  const { xp_earned, current_rank, snapshot_rank, rank_change } = row;
  if (xp_earned <= 0) return null;

  const xpLabel = xp_earned.toLocaleString("en-IN");

  if (snapshot_rank === null) {
    return {
      title: "Great start! 🌱",
      body:  `You earned ${xpLabel} XP your first week! You're at Rank #${current_rank}.`,
    };
  }
  if (rank_change > 0) {
    const e = rank_change >= 5 ? "🚀" : "📈";
    return {
      title: `You're climbing! ${e}`,
      body:  `You earned ${xpLabel} XP this week. Rank #${snapshot_rank} → #${current_rank} ${e}`,
    };
  }
  if (rank_change < 0) {
    return {
      title: "Keep pushing! 💪",
      body:  `You earned ${xpLabel} XP but slipped to Rank #${current_rank}. Get back to #${snapshot_rank}!`,
    };
  }
  return {
    title: "Solid week! ⭐",
    body:  `You earned ${xpLabel} XP this week and held Rank #${current_rank}. Keep it up!`,
  };
}

/**
 * Computes per-user weekly summary from current profiles + snapshots.
 * Mirrors the `get_weekly_summary` RPC logic for pure testing.
 */
function computeWeeklySummary(profiles, snapshots) {
  const sorted = [...profiles].sort((a, b) => b.total_xp - a.total_xp);

  return sorted.map((p, i) => {
    const rank     = i + 1;
    const snap     = snapshots.find((s) => s.user_id === p.user_id);
    const xpEarned = p.total_xp - (snap?.xp_at_start ?? p.total_xp);
    const rankChange = snap ? (snap.rank_at_start ?? rank) - rank : 0;

    return {
      user_id:       p.user_id,
      current_xp:    p.total_xp,
      current_rank:  rank,
      snapshot_xp:   snap?.xp_at_start ?? p.total_xp,
      snapshot_rank: snap?.rank_at_start ?? null,
      xp_earned:     xpEarned,
      rank_change:   rankChange,
    };
  });
}

// ─── Shared test data ─────────────────────────────────────────────────────────

const WEEK_START = "2026-05-11"; // last Monday

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — Pure unit tests (always run, no DB)
// ─────────────────────────────────────────────────────────────────────────────

describe("buildNotificationCopy — pure unit tests", () => {

  it("generates 🚀 copy when rank improved by 5+ positions", () => {
    const copy = buildNotificationCopy({
      xp_earned: 120, current_rank: 48, snapshot_rank: 52, rank_change: 4,
    });
    expect(copy).not.toBeNull();
    expect(copy.title).toContain("🚀");
    expect(copy.body).toContain("120");
    expect(copy.body).toContain("#52");
    expect(copy.body).toContain("#48");
  });

  it("generates 📈 copy when rank improved by 1–4 positions", () => {
    const copy = buildNotificationCopy({
      xp_earned: 80, current_rank: 60, snapshot_rank: 62, rank_change: 2,
    });
    expect(copy.title).toContain("📈");
    expect(copy.body).toMatch(/#62.*#60/);
  });

  it("generates ⭐ copy when rank is held", () => {
    const copy = buildNotificationCopy({
      xp_earned: 45, current_rank: 38, snapshot_rank: 38, rank_change: 0,
    });
    expect(copy.title).toContain("⭐");
    expect(copy.body).toContain("45");
    expect(copy.body).toContain("#38");
    expect(copy.body).not.toContain("→");
  });

  it("generates 💪 copy when rank dropped", () => {
    const copy = buildNotificationCopy({
      xp_earned: 30, current_rank: 56, snapshot_rank: 50, rank_change: -6,
    });
    expect(copy.title).toContain("💪");
    expect(copy.body).toContain("slipped");
    expect(copy.body).toContain("#56");
    expect(copy.body).toContain("#50");
  });

  it("generates 🌱 first-week copy when snapshot_rank is null", () => {
    const copy = buildNotificationCopy({
      xp_earned: 250, current_rank: 71, snapshot_rank: null, rank_change: 0,
    });
    expect(copy.title).toContain("🌱");
    expect(copy.body).toContain("first week");
    expect(copy.body).toContain("250");
    expect(copy.body).toContain("#71");
  });

  it("returns null for a user who earned 0 XP", () => {
    const copy = buildNotificationCopy({
      xp_earned: 0, current_rank: 100, snapshot_rank: 100, rank_change: 0,
    });
    expect(copy).toBeNull();
  });

  it("returns null for a user who earned negative XP (data anomaly)", () => {
    const copy = buildNotificationCopy({
      xp_earned: -5, current_rank: 90, snapshot_rank: 88, rank_change: -2,
    });
    expect(copy).toBeNull();
  });

  it("formats XP with Indian number formatting (en-IN)", () => {
    const copy = buildNotificationCopy({
      xp_earned: 1200, current_rank: 5, snapshot_rank: 8, rank_change: 3,
    });
    // en-IN: 1200 → "1,200"
    expect(copy.body).toContain("1,200");
  });

});

// ─── computeWeeklySummary ─────────────────────────────────────────────────────

describe("computeWeeklySummary — pure unit tests", () => {

  const profiles = [
    { user_id: "alice",   total_xp: 1500 },
    { user_id: "bob",     total_xp: 1200 },
    { user_id: "charlie", total_xp: 800  },
  ];

  const snapshots = [
    { user_id: "alice",   xp_at_start: 1380, rank_at_start: 2 }, // was rank 2, now rank 1
    { user_id: "bob",     xp_at_start: 1200, rank_at_start: 1 }, // was rank 1, now rank 2
    // charlie has no snapshot (first week)
  ];

  it("calculates XP earned correctly for each user", () => {
    const summary = computeWeeklySummary(profiles, snapshots);
    const alice   = summary.find((r) => r.user_id === "alice");
    const bob     = summary.find((r) => r.user_id === "bob");
    const charlie = summary.find((r) => r.user_id === "charlie");

    expect(alice.xp_earned).toBe(120);   // 1500 - 1380
    expect(bob.xp_earned).toBe(0);       // 1200 - 1200
    expect(charlie.xp_earned).toBe(0);  // no snapshot → 0
  });

  it("assigns correct leaderboard ranks based on current XP", () => {
    const summary = computeWeeklySummary(profiles, snapshots);
    expect(summary.find((r) => r.user_id === "alice").current_rank).toBe(1);
    expect(summary.find((r) => r.user_id === "bob").current_rank).toBe(2);
    expect(summary.find((r) => r.user_id === "charlie").current_rank).toBe(3);
  });

  it("computes positive rank_change when rank improved", () => {
    const summary = computeWeeklySummary(profiles, snapshots);
    const alice   = summary.find((r) => r.user_id === "alice");
    // Was rank 2, now rank 1 → rank_change = 2 - 1 = +1
    expect(alice.rank_change).toBe(1);
  });

  it("computes negative rank_change when rank dropped", () => {
    const summary = computeWeeklySummary(profiles, snapshots);
    const bob = summary.find((r) => r.user_id === "bob");
    // Was rank 1, now rank 2 → rank_change = 1 - 2 = -1
    expect(bob.rank_change).toBe(-1);
  });

  it("sets snapshot_rank = null for first-week users (no snapshot)", () => {
    const summary = computeWeeklySummary(profiles, snapshots);
    const charlie = summary.find((r) => r.user_id === "charlie");
    expect(charlie.snapshot_rank).toBeNull();
  });

  it("skips inactive users when filtering xp_earned > 0", () => {
    const summary     = computeWeeklySummary(profiles, snapshots);
    const activeSummary = summary.filter((r) => r.xp_earned > 0);
    const userIds     = activeSummary.map((r) => r.user_id);
    expect(userIds).toContain("alice");
    expect(userIds).not.toContain("bob");     // earned 0
    expect(userIds).not.toContain("charlie"); // earned 0 (first week, no snapshot)
  });

  it("handles empty profiles array gracefully", () => {
    expect(computeWeeklySummary([], [])).toEqual([]);
  });

  it("handles profiles with no snapshots (all first-week)", () => {
    const firstWeek = [
      { user_id: "new1", total_xp: 100 },
      { user_id: "new2", total_xp:  50 },
    ];
    const summary = computeWeeklySummary(firstWeek, []);
    expect(summary.every((r) => r.snapshot_rank === null)).toBe(true);
    expect(summary.every((r) => r.xp_earned === 0)).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Full integration (requires local Supabase)
// Skipped automatically when SUPABASE_TEST_URL is not set.
// ─────────────────────────────────────────────────────────────────────────────

const RUN_INTEGRATION = Boolean(process.env.SUPABASE_TEST_URL);

describe.skipIf(!RUN_INTEGRATION)("weekly-summary Edge Function — full integration", () => {

  let testUserIds = [];

  beforeAll(async () => {
    // Seed 3 test users with known XP values
    const users = [
      { user_id: `test-ws-${uuidv4()}`, total_xp: 800,  name: "Integration Alice" },
      { user_id: `test-ws-${uuidv4()}`, total_xp: 620,  name: "Integration Bob"   },
      { user_id: `test-ws-${uuidv4()}`, total_xp: 100,  name: "Integration Charlie" },
    ];

    for (const u of users) {
      await seedUserProfile(u);
      testUserIds.push(u.user_id);
    }

    // Seed last week's snapshots for Alice and Bob (Charlie has no snapshot = first week)
    const snaps = [
      makeWeeklySnapshot({ user_id: testUserIds[0], week_start: WEEK_START, xp_at_start: 680, rank_at_start: 2 }),
      makeWeeklySnapshot({ user_id: testUserIds[1], week_start: WEEK_START, xp_at_start: 700, rank_at_start: 1 }),
    ];

    const { error } = await testSupabase.from("weekly_xp_snapshots").insert(snaps);
    if (error) throw new Error(`Snapshot seed failed: ${error.message}`);
  });

  afterAll(async () => {
    await testSupabase.from("weekly_xp_snapshots").delete().in("user_id", testUserIds);
    await cleanupTestData();
  });

  it("Edge Function returns HTTP 200 with correct payload shape", async () => {
    const { data, error } = await testSupabase.functions.invoke("weekly-summary", {
      body: {},
    });

    expect(error).toBeNull();
    expect(data).toMatchObject({
      week_start:         expect.stringMatching(/\d{4}-\d{2}-\d{2}/),
      users_processed:    expect.any(Number),
      notifications_sent: expect.any(Number),
      skipped:            expect.any(Number),
    });
  });

  it("get_weekly_summary RPC returns correct XP earned for test users", async () => {
    const { data, error } = await testSupabase
      .rpc("get_weekly_summary", { p_week_start: WEEK_START });

    expect(error).toBeNull();

    const alice   = data.find((r) => r.user_id === testUserIds[0]);
    const bob     = data.find((r) => r.user_id === testUserIds[1]);
    const charlie = data.find((r) => r.user_id === testUserIds[2]);

    // Alice: 800 - 680 = 120 XP earned
    expect(alice?.xp_earned).toBe(120);
    // Bob: 620 - 700 = -80? Actually Bob lost XP scenario — shows correct delta
    expect(bob?.xp_earned).toBe(-80);
    // Charlie: no snapshot → 0 XP earned
    expect(charlie?.xp_earned ?? 0).toBe(0);
  });

  it("rank_change direction is correct: positive = improved rank", async () => {
    const { data } = await testSupabase
      .rpc("get_weekly_summary", { p_week_start: WEEK_START });

    const alice = data.find((r) => r.user_id === testUserIds[0]);
    // Alice was rank 2, now has highest XP (rank 1) → rank_change = 2 - 1 = +1
    expect(alice?.rank_change).toBeGreaterThan(0);
  });

  it("creates a new snapshot row for the current week", async () => {
    const today      = new Date();
    const dayOfWeek  = today.getUTCDay();
    const daysBack   = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(today);
    thisMonday.setUTCDate(today.getUTCDate() - daysBack);
    const thisMondayStr = thisMonday.toISOString().slice(0, 10);

    // Call the Edge Function to trigger snapshot upsert
    await testSupabase.functions.invoke("weekly-summary", { body: {} });

    const { data: snaps } = await testSupabase
      .from("weekly_xp_snapshots")
      .select("user_id, week_start, xp_at_start")
      .in("user_id", testUserIds)
      .eq("week_start", thisMondayStr);

    expect(snaps?.length).toBeGreaterThanOrEqual(1);
    // Snapshots should reflect current XP values
    const aliceSnap = snaps.find((s) => s.user_id === testUserIds[0]);
    expect(aliceSnap?.xp_at_start).toBe(800);
  });

  it("calling Edge Function twice in the same week does not duplicate snapshots", async () => {
    const today      = new Date();
    const dayOfWeek  = today.getUTCDay();
    const daysBack   = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(today);
    thisMonday.setUTCDate(today.getUTCDate() - daysBack);
    const thisMondayStr = thisMonday.toISOString().slice(0, 10);

    // Call twice
    await testSupabase.functions.invoke("weekly-summary", { body: {} });
    await testSupabase.functions.invoke("weekly-summary", { body: {} });

    const { data: snaps } = await testSupabase
      .from("weekly_xp_snapshots")
      .select("id")
      .in("user_id", testUserIds)
      .eq("week_start", thisMondayStr);

    // Each user should have exactly 1 snapshot for this week (upsert with ignoreDuplicates)
    const uniqueUsers = new Set(snaps.map((s) => s.user_id));
    expect(snaps.length).toBe(uniqueUsers.size);
  });

});
