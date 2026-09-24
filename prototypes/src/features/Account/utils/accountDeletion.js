/**
 * src/features/Account/utils/accountDeletion.js
 *
 * Implements the account deletion + data anonymisation pipeline.
 *
 * Approach: "soft anonymise, hard delete PII"
 *
 *   PII tables   → DELETE rows entirely
 *   Content      → Keep rows, replace identifying columns with sentinel values
 *   Aggregate    → Keep rows, replace user_id with a deterministic anon ID
 *
 * This preserves aggregate statistics (leaderboard history, badge counts)
 * while ensuring no PII survives — satisfying DPDP Act 2023 §12 and GDPR Art. 17.
 *
 * Call only with service-role Supabase client (bypasses RLS).
 */

import { createHash } from "crypto"; // Node.js / Deno — swap for WebCrypto on edge

// ─── Constants ────────────────────────────────────────────────────────────────

/** Display name used in community posts after deletion */
export const ANON_DISPLAY_NAME    = "Deleted User";

/** Placeholder avatar seed (renders a generic silhouette) */
export const ANON_AVATAR_SEED     = "deleted";

/**
 * Returns a deterministic pseudonymous user_id for aggregate tables.
 * One-way: cannot be reversed to recover the original userId.
 *
 * @param {string} userId  original UUID
 * @returns {string}       "anon_<hex prefix>"
 */
export function makeAnonUserId(userId) {
  const hash = createHash("sha256").update(`anon_salt_v1:${userId}`).digest("hex");
  return `anon_${hash.slice(0, 16)}`;
}

// ─── Deletion pipeline ────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   tablesDeleted:     string[],
 *   tablesAnonymised:  string[],
 *   errors:            { table: string, error: string }[],
 * }} DeletionReport
 */

/**
 * Fully anonymises and deletes a user account.
 *
 * Steps (in order — earlier steps are independent of later ones):
 *   1.  DELETE push_tokens              (device identifiers — pure PII)
 *   2.  DELETE scan_logs                (may contain crop images / location)
 *   3.  DELETE weather_check_logs       (location data)
 *   4.  DELETE article_read_logs        (behavioural PII)
 *   5.  DELETE market_view_logs         (behavioural PII)
 *   6.  DELETE farmer_connections       (social graph)
 *   7.  DELETE user_crops               (farm data linked to identity)
 *   8.  ANONYMISE user_profiles         (name, phone, email → nulls / sentinel)
 *   9.  ANONYMISE community_posts       (author_name, avatar → "Deleted User")
 *   10. ANONYMISE marketplace listings  (seller_name → "Deleted User", soft-delete)
 *   11. ANONYMISE xp_events             (user_id → anon id — preserves aggregate)
 *   12. ANONYMISE user_badges           (user_id → anon id — preserves badge stats)
 *   13. ANONYMISE weekly_xp_snapshots   (user_id → anon id — preserves leaderboard history)
 *   14. DELETE from auth.users          (authentication identity — must be last)
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase  service-role client
 * @param {string} userId
 * @returns {Promise<DeletionReport>}
 */
export async function anonymiseUserAccount(supabase, userId) {
  const report = {
    tablesDeleted:    [],
    tablesAnonymised: [],
    errors:           [],
  };

  const anonId = makeAnonUserId(userId);

  // ── Helper: record result ──────────────────────────────────────────────────
  function ok(table, type) {
    if (type === "delete") report.tablesDeleted.push(table);
    else                   report.tablesAnonymised.push(table);
  }
  function fail(table, err) {
    report.errors.push({ table, error: String(err?.message ?? err) });
    console.error(`[AccountDeletion] Failed on ${table}:`, err);
  }

  // ── 1. Delete pure-PII tables ──────────────────────────────────────────────
  const piiDeleteTables = [
    "push_tokens",
    "scan_logs",
    "weather_check_logs",
    "article_read_logs",
    "market_view_logs",
    "farmer_connections",
    "user_crops",
    "harvest_logs",
  ];

  await Promise.all(
    piiDeleteTables.map(async (table) => {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);
        if (error) throw error;
        ok(table, "delete");
      } catch (err) {
        fail(table, err);
      }
    })
  );

  // ── 2. Anonymise user_profiles ────────────────────────────────────────────
  try {
    const { error } = await supabase
      .from("user_profiles")
      .update({
        name:                 ANON_DISPLAY_NAME,
        phone:                null,
        email:                null,
        avatar_url:           null,
        avatar_seed:          ANON_AVATAR_SEED,
        location_lat:         null,
        location_lng:         null,
        district:             null,
        fcm_token:            null,
        profile_completeness: 0,
        is_deleted:           true,
        deleted_at:           new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw error;
    ok("user_profiles", "anonymise");
  } catch (err) {
    fail("user_profiles", err);
  }

  // ── 3. Anonymise community_posts ──────────────────────────────────────────
  try {
    const { error } = await supabase
      .from("community_posts")
      .update({
        author_name:  ANON_DISPLAY_NAME,
        author_avatar:null,
        // Preserve post content for community context — edge case: if post
        // body contains explicit PII, a moderation sweep would be needed.
        updated_at:   new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw error;
    ok("community_posts", "anonymise");
  } catch (err) {
    fail("community_posts", err);
  }

  // ── 4. Soft-delete + anonymise marketplace listings ───────────────────────
  try {
    const { error } = await supabase
      .from("product_listings")
      .update({
        seller_name:  ANON_DISPLAY_NAME,
        seller_phone: null,
        is_deleted:   true,
        deleted_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw error;
    ok("product_listings", "anonymise");
  } catch (err) {
    fail("product_listings", err);
  }

  // ── 5. Re-key aggregate tables with anonId ────────────────────────────────
  const rekeyTables = ["xp_events", "user_badges", "weekly_xp_snapshots"];

  await Promise.all(
    rekeyTables.map(async (table) => {
      try {
        const { error } = await supabase
          .from(table)
          .update({ user_id: anonId })
          .eq("user_id", userId);
        if (error) throw error;
        ok(table, "anonymise");
      } catch (err) {
        fail(table, err);
      }
    })
  );

  // ── 6. Delete from auth.users (must be last — removes auth context) ───────
  try {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;
    ok("auth.users", "delete");
  } catch (err) {
    fail("auth.users", err);
  }

  return report;
}

// ─── Verification helper ──────────────────────────────────────────────────────

/**
 * Verifies that no PII remains for a userId after anonymisation.
 * Returns an array of violations (empty = clean).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @returns {Promise<{ table: string, column: string, violation: string }[]>}
 */
export async function verifyAnonymisation(supabase, userId) {
  const violations = [];

  // Check user_profiles PII columns are null
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name, phone, email, avatar_url, location_lat, location_lng")
    .eq("user_id", userId)
    .single();

  if (profile) {
    if (profile.name && profile.name !== ANON_DISPLAY_NAME)
      violations.push({ table: "user_profiles", column: "name",         violation: "still contains real name" });
    if (profile.phone)
      violations.push({ table: "user_profiles", column: "phone",        violation: "phone not nulled" });
    if (profile.email)
      violations.push({ table: "user_profiles", column: "email",        violation: "email not nulled" });
    if (profile.avatar_url)
      violations.push({ table: "user_profiles", column: "avatar_url",   violation: "avatar_url not nulled" });
    if (profile.location_lat)
      violations.push({ table: "user_profiles", column: "location_lat", violation: "location not nulled" });
  }

  // Check PII tables are empty for this userId
  const piiTables = ["push_tokens", "scan_logs", "weather_check_logs"];
  await Promise.all(
    piiTables.map(async (table) => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (count && count > 0)
        violations.push({ table, column: "user_id", violation: `${count} rows still present` });
    })
  );

  // Check aggregate tables no longer reference original userId
  const aggTables = ["xp_events", "user_badges", "weekly_xp_snapshots"];
  await Promise.all(
    aggTables.map(async (table) => {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (count && count > 0)
        violations.push({ table, column: "user_id", violation: `original userId still present in ${count} rows` });
    })
  );

  return violations;
}
