/**
 * __tests__/helpers/testFactories.js
 *
 * Factory functions for consistent, readable test data.
 * Call with overrides to customise individual fields.
 */

let _idCounter = 1;
const nextId = () => `test-user-${_idCounter++}`;
export const resetIdCounter = () => { _idCounter = 1; };

// ─── User profile ─────────────────────────────────────────────────────────────

/**
 * @param {Partial<UserProfile>} overrides
 * @returns {UserProfile}
 */
export function makeUserProfile(overrides = {}) {
  return {
    user_id:              nextId(),
    name:                 "Test Farmer",
    state:                "Gujarat",
    total_xp:             0,
    current_streak:       0,
    last_login_at:        null,
    profile_completeness: 0,
    user_timezone:        "Asia/Kolkata",
    created_at:           new Date("2026-04-15T00:00:00Z").toISOString(),
    updated_at:           new Date("2026-04-15T00:00:00Z").toISOString(),
    ...overrides,
  };
}

// ─── Leaderboard entries ──────────────────────────────────────────────────────

/**
 * Creates a sorted leaderboard (descending by XP) from a list of XP values.
 * userId = "user-N" where N matches the position in the array.
 *
 * @param {number[]} xpValues  e.g. [1200, 1000, 800]
 * @returns {{ userId: string, xp: number }[]}
 */
export function makeLeaderboard(xpValues) {
  return xpValues
    .map((xp, i) => ({ userId: `user-${i + 1}`, xp }))
    .sort((a, b) => b.xp - a.xp);
}

// ─── XP event ─────────────────────────────────────────────────────────────────

export function makeXPEvent(overrides = {}) {
  return {
    eventId:  `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId:   nextId(),
    action:   "scan",
    xpAmount: 10,
    metadata: {},
    ...overrides,
  };
}

// ─── Weekly snapshot ──────────────────────────────────────────────────────────

export function makeWeeklySnapshot(overrides = {}) {
  return {
    user_id:       nextId(),
    week_start:    "2026-05-11",  // previous Monday
    xp_at_start:   500,
    rank_at_start: 42,
    ...overrides,
  };
}

// ─── Weekly summary row (output of get_weekly_summary RPC) ────────────────────

export function makeWeeklySummaryRow(overrides = {}) {
  return {
    user_id:       nextId(),
    current_xp:    620,
    current_rank:  38,
    snapshot_xp:   500,
    snapshot_rank: 42,
    xp_earned:     120,
    rank_change:   4,    // positive = improved
    ...overrides,
  };
}

// ─── Badge row ────────────────────────────────────────────────────────────────

export function makeBadge(overrides = {}) {
  return {
    id:         `badge-${nextId()}`,
    slug:       "first-scan",
    name:       "First Scan",
    xp_reward:  50,
    ...overrides,
  };
}


// =============================================================================
// supabaseTestClient.js  (same file for simplicity — split if needed)
// =============================================================================

/**
 * __tests__/helpers/supabaseTestClient.js
 *
 * Real Supabase client for INTEGRATION tests.
 * Points at a local `supabase start` instance (or a dedicated test project).
 *
 * ⚠️  NEVER use production credentials here.
 * ⚠️  Integration tests require a running local Supabase: `npx supabase start`
 *
 * Environment variables (from .env.test):
 *   SUPABASE_TEST_URL              = http://localhost:54321
 *   SUPABASE_TEST_SERVICE_ROLE_KEY = (from `supabase status`)
 */

import { createClient } from "@supabase/supabase-js";

const TEST_URL     = process.env.SUPABASE_TEST_URL             ?? "http://localhost:54321";
const SERVICE_KEY  = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? "test-service-role-key";

/** Admin client — bypasses RLS. Use only in integration tests. */
export const testSupabase = createClient(TEST_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Seed / teardown helpers ──────────────────────────────────────────────────

/**
 * Seeds a user_profiles row for integration tests.
 * Returns the inserted row.
 */
export async function seedUserProfile(profile = {}) {
  const row = makeUserProfile(profile);
  const { data, error } = await testSupabase
    .from("user_profiles")
    .insert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Removes all rows created by integration tests (matched by id prefix "test-").
 * Call in afterAll / afterEach.
 */
export async function cleanupTestData() {
  const tables = [
    "xp_events", "user_badges", "weekly_xp_snapshots",
    "scan_logs", "market_view_logs", "community_posts",
    "harvest_logs", "product_listings", "article_read_logs",
    "weather_check_logs", "farmer_connections", "user_crops",
    "push_tokens", "user_profiles",
  ];

  for (const table of tables) {
    await testSupabase.from(table).delete().like("user_id", "test-%");
  }
}
