/**
 * src/features/Account/__tests__/integration/accountDeletion.test.js
 *
 * Tests the full account deletion + data anonymisation pipeline.
 *
 * Layer strategy (same pattern as gamification tests):
 *   LAYER 1 (pure, always CI):  Tests makeAnonUserId() and the logic of
 *                               each deletion / anonymisation step in isolation,
 *                               using a mock Supabase client.
 *   LAYER 2 (DB, gated):        Seeds a full user record, calls
 *                               anonymiseUserAccount(), then calls
 *                               verifyAnonymisation() to confirm zero PII.
 *
 * Run pure:        npx vitest run accountDeletion
 * Run integration: SUPABASE_TEST_URL=http://localhost:54321 npx vitest run accountDeletion
 *
 * Covers:
 *   ✓ makeAnonUserId — deterministic, irreversible, non-empty
 *   ✓ makeAnonUserId — same input always produces same output
 *   ✓ makeAnonUserId — different inputs produce different outputs
 *   ✓ PII tables deleted (push_tokens, scan_logs, weather_check_logs, etc.)
 *   ✓ user_profiles: name → "Deleted User", phone/email/avatar → null
 *   ✓ user_profiles: is_deleted = true, deleted_at set
 *   ✓ community_posts: author_name → "Deleted User"
 *   ✓ product_listings: seller_name → "Deleted User", is_deleted = true
 *   ✓ Aggregate tables (xp_events, user_badges, weekly_xp_snapshots):
 *       user_id replaced with anonId (rows preserved, identity removed)
 *   ✓ auth.users: user removed from auth system
 *   ✓ verifyAnonymisation returns zero violations after clean deletion
 *   ✓ DeletionReport lists every table processed
 *   ✓ Partial failure: one table error doesn't abort the rest (best-effort)
 *   ✓ anonId rows in aggregate tables are NOT deleted — stats preserved
 *   ✓ Calling deletion twice is safe (idempotent) — no crash on missing rows
 */

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { v4 as uuidv4 } from "uuid";
import {
  makeAnonUserId,
  anonymiseUserAccount,
  verifyAnonymisation,
  ANON_DISPLAY_NAME,
} from "../../utils/accountDeletion";
import { createMockSupabase } from "../../../Notifications/__tests__/helpers/mockHelpers";
import {
  testSupabase,
  cleanupTestData,
} from "../../../Gamification/__tests__/helpers/testFactories";

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 1 — Pure unit tests (always CI)
// ─────────────────────────────────────────────────────────────────────────────

describe("makeAnonUserId", () => {

  it("returns a non-empty string", () => {
    expect(makeAnonUserId("user-abc-123")).toBeTruthy();
  });

  it("starts with 'anon_' prefix", () => {
    expect(makeAnonUserId("user-abc-123")).toMatch(/^anon_/);
  });

  it("is deterministic — same input always produces same output", () => {
    const id = "3f2504e0-4f89-11d3-9a0c-0305e82c3301";
    expect(makeAnonUserId(id)).toBe(makeAnonUserId(id));
  });

  it("different user IDs produce different anon IDs", () => {
    const a = makeAnonUserId("user-aaa");
    const b = makeAnonUserId("user-bbb");
    expect(a).not.toBe(b);
  });

  it("does not contain the original user ID (one-way)", () => {
    const userId  = "user-reveal-test-12345";
    const anonId  = makeAnonUserId(userId);
    expect(anonId).not.toContain(userId);
    expect(anonId).not.toContain("reveal");
  });

  it("produces a consistent 16-char hex suffix", () => {
    const anonId = makeAnonUserId("user-test");
    // Format: "anon_<16 hex chars>"
    expect(anonId).toMatch(/^anon_[0-9a-f]{16}$/);
  });
});

// ─── anonymiseUserAccount with mock Supabase ──────────────────────────────────

describe("anonymiseUserAccount — mock Supabase (pure logic)", () => {

  function buildMockSb() {
    const sb = createMockSupabase();
    // Make all DB calls succeed by default
    sb.from.mockReturnValue({
      delete:  vi.fn().mockReturnValue({ or: vi.fn().mockResolvedValue({ error: null }), eq: vi.fn().mockResolvedValue({ error: null }) }),
      update:  vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      select:  vi.fn().mockReturnThis(),
      eq:      vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    sb.auth = { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } };
    return sb;
  }

  it("calls auth.admin.deleteUser with the correct userId", async () => {
    const sb     = buildMockSb();
    const userId = "user-to-delete-123";
    await anonymiseUserAccount(sb, userId);
    expect(sb.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
  });

  it("includes auth.users in the tablesDeleted report", async () => {
    const sb     = buildMockSb();
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.tablesDeleted).toContain("auth.users");
  });

  it("includes user_profiles in tablesAnonymised", async () => {
    const sb     = buildMockSb();
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.tablesAnonymised).toContain("user_profiles");
  });

  it("includes community_posts in tablesAnonymised", async () => {
    const sb     = buildMockSb();
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.tablesAnonymised).toContain("community_posts");
  });

  it("includes push_tokens in tablesDeleted", async () => {
    const sb     = buildMockSb();
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.tablesDeleted).toContain("push_tokens");
  });

  it("includes xp_events, user_badges, weekly_xp_snapshots in tablesAnonymised", async () => {
    const sb     = buildMockSb();
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.tablesAnonymised).toContain("xp_events");
    expect(report.tablesAnonymised).toContain("user_badges");
    expect(report.tablesAnonymised).toContain("weekly_xp_snapshots");
  });

  it("reports no errors when all DB calls succeed", async () => {
    const sb     = buildMockSb();
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.errors).toHaveLength(0);
  });

  it("records an error entry but continues when one table fails", async () => {
    const sb = buildMockSb();

    // Make push_tokens deletion fail
    let callCount = 0;
    sb.from.mockImplementation((table) => {
      if (table === "push_tokens") {
        return {
          delete: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({ error: { message: "Table locked" } }),
            eq: vi.fn().mockResolvedValue({ error: { message: "Table locked" } }),
          }),
        };
      }
      return {
        delete: vi.fn().mockReturnValue({ or: vi.fn().mockResolvedValue({ error: null }), eq: vi.fn().mockResolvedValue({ error: null }) }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      };
    });

    const report = await anonymiseUserAccount(sb, "user-abc");

    // Should have exactly one error
    expect(report.errors.some((e) => e.table === "push_tokens")).toBe(true);
    // But other tables should still be processed
    expect(report.tablesAnonymised).toContain("user_profiles");
    expect(report.tablesDeleted).toContain("auth.users");
  });

  it("does not throw when auth.admin.deleteUser fails", async () => {
    const sb = buildMockSb();
    sb.auth.admin.deleteUser = vi.fn().mockResolvedValue({
      error: { message: "User not found" },
    });
    const report = await anonymiseUserAccount(sb, "user-abc");
    expect(report.errors.some((e) => e.table === "auth.users")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// LAYER 2 — Full integration (requires local Supabase)
// ─────────────────────────────────────────────────────────────────────────────

const RUN_INTEGRATION = Boolean(process.env.SUPABASE_TEST_URL);

describe.skipIf(!RUN_INTEGRATION)("anonymiseUserAccount — full DB integration", () => {
  let userId;
  let anonId;

  beforeAll(async () => {
    userId = `test-del-${uuidv4()}`;
    anonId = makeAnonUserId(userId);

    // ── Seed a complete user record across every table ──────────────────────

    // user_profiles
    await testSupabase.from("user_profiles").insert({
      user_id:              userId,
      name:                 "Real Farmer Name",
      phone:                "+919876543210",
      email:                "farmer@test.com",
      avatar_url:           "https://cdn.kisansathi.in/avatars/test.jpg",
      location_lat:         23.0225,
      location_lng:         72.5714,
      district:             "Ahmedabad",
      total_xp:             1200,
      current_streak:       8,
      profile_completeness: 100,
      is_deleted:           false,
    });

    // push_tokens (PII)
    await testSupabase.from("push_tokens").insert({
      user_id: userId, token: "fcm-real-token-abc", platform: "android",
    });

    // scan_logs (PII)
    await testSupabase.from("scan_logs").insert({
      user_id: userId, crop_type: "wheat", scanned_at: new Date().toISOString(),
    });

    // weather_check_logs (PII)
    await testSupabase.from("weather_check_logs").insert({
      user_id: userId, checked_at: new Date().toISOString(),
    });

    // community_posts (content — author should be anonymised)
    await testSupabase.from("community_posts").insert({
      user_id:      userId,
      author_name:  "Real Farmer Name",
      content:      "This is my farming tip for Kharif season.",
      created_at:   new Date().toISOString(),
    });

    // product_listings (marketplace — soft-delete + anonymise)
    await testSupabase.from("product_listings").insert({
      user_id:      userId,
      seller_name:  "Real Farmer Name",
      seller_phone: "+919876543210",
      commodity:    "wheat",
      price:        2400,
      is_deleted:   false,
    });

    // xp_events (aggregate — user_id re-keyed, row preserved)
    await testSupabase.from("xp_events").insert({
      id: uuidv4(), user_id: userId, action: "scan", xp_amount: 10,
    });

    // user_badges (aggregate — user_id re-keyed, row preserved)
    const { data: badge } = await testSupabase
      .from("badges").select("id").limit(1).single();
    if (badge) {
      await testSupabase.from("user_badges").insert({
        user_id: userId, badge_id: badge.id, earned_at: new Date().toISOString(),
      });
    }

    // weekly_xp_snapshots (aggregate — user_id re-keyed)
    await testSupabase.from("weekly_xp_snapshots").insert({
      user_id:       userId,
      week_start:    "2026-05-11",
      xp_at_start:   1000,
      rank_at_start: 55,
    });

    // ── Run the deletion ────────────────────────────────────────────────────
    await anonymiseUserAccount(testSupabase, userId);
  });

  afterAll(async () => {
    // Clean up any residual rows using anonId (aggregate tables)
    const aggTables = ["xp_events", "user_badges", "weekly_xp_snapshots"];
    for (const table of aggTables) {
      await testSupabase.from(table).delete().eq("user_id", anonId);
    }
    await cleanupTestData();
  });

  // ── PII tables must be empty ─────────────────────────────────────────────

  it("push_tokens are deleted", async () => {
    const { count } = await testSupabase
      .from("push_tokens").select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count ?? 0).toBe(0);
  });

  it("scan_logs are deleted", async () => {
    const { count } = await testSupabase
      .from("scan_logs").select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count ?? 0).toBe(0);
  });

  it("weather_check_logs are deleted", async () => {
    const { count } = await testSupabase
      .from("weather_check_logs").select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count ?? 0).toBe(0);
  });

  // ── user_profiles PII nulled ─────────────────────────────────────────────

  it("user_profiles.name is replaced with 'Deleted User'", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("name").eq("user_id", userId).single();
    expect(data?.name).toBe(ANON_DISPLAY_NAME);
  });

  it("user_profiles.phone is null", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("phone").eq("user_id", userId).single();
    expect(data?.phone).toBeNull();
  });

  it("user_profiles.email is null", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("email").eq("user_id", userId).single();
    expect(data?.email).toBeNull();
  });

  it("user_profiles.avatar_url is null", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("avatar_url").eq("user_id", userId).single();
    expect(data?.avatar_url).toBeNull();
  });

  it("user_profiles.location_lat is null", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("location_lat").eq("user_id", userId).single();
    expect(data?.location_lat).toBeNull();
  });

  it("user_profiles.is_deleted = true", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("is_deleted").eq("user_id", userId).single();
    expect(data?.is_deleted).toBe(true);
  });

  it("user_profiles.deleted_at is set (not null)", async () => {
    const { data } = await testSupabase
      .from("user_profiles").select("deleted_at").eq("user_id", userId).single();
    expect(data?.deleted_at).toBeTruthy();
  });

  // ── community_posts anonymised ────────────────────────────────────────────

  it("community_posts.author_name is 'Deleted User'", async () => {
    const { data } = await testSupabase
      .from("community_posts").select("author_name").eq("user_id", userId);
    expect(data?.every((r) => r.author_name === ANON_DISPLAY_NAME)).toBe(true);
  });

  it("community_posts.author_avatar is null", async () => {
    const { data } = await testSupabase
      .from("community_posts").select("author_avatar").eq("user_id", userId);
    expect(data?.every((r) => r.author_avatar === null)).toBe(true);
  });

  // ── product_listings soft-deleted ─────────────────────────────────────────

  it("product_listings.is_deleted = true", async () => {
    const { data } = await testSupabase
      .from("product_listings").select("is_deleted, seller_name").eq("user_id", userId);
    expect(data?.every((r) => r.is_deleted === true)).toBe(true);
    expect(data?.every((r) => r.seller_name === ANON_DISPLAY_NAME)).toBe(true);
  });

  // ── Aggregate tables: original userId gone, anonId present ───────────────

  it("xp_events no longer reference original userId", async () => {
    const { count } = await testSupabase
      .from("xp_events").select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count ?? 0).toBe(0);
  });

  it("xp_events rows preserved under anonId (stats not lost)", async () => {
    const { count } = await testSupabase
      .from("xp_events").select("*", { count: "exact", head: true })
      .eq("user_id", anonId);
    expect(count ?? 0).toBeGreaterThanOrEqual(1);
  });

  it("user_badges no longer reference original userId", async () => {
    const { count } = await testSupabase
      .from("user_badges").select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count ?? 0).toBe(0);
  });

  it("weekly_xp_snapshots no longer reference original userId", async () => {
    const { count } = await testSupabase
      .from("weekly_xp_snapshots").select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    expect(count ?? 0).toBe(0);
  });

  // ── verifyAnonymisation returns zero violations ────────────────────────────

  it("verifyAnonymisation() returns an empty violations array", async () => {
    const violations = await verifyAnonymisation(testSupabase, userId);
    expect(violations).toEqual([]);
  });

  // ── Idempotency — calling twice is safe ────────────────────────────────────

  it("calling anonymiseUserAccount a second time does not throw", async () => {
    await expect(anonymiseUserAccount(testSupabase, userId)).resolves.not.toThrow();
  });
});
