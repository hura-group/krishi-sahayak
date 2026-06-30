/**
 * utils/badgeCriteria.js
 *
 * Badge award criteria extracted from the Edge Function into pure,
 * database-adapter-based functions — fully unit-testable without Supabase.
 *
 * The Edge Function imports these and passes its Supabase client as the adapter.
 * Tests pass a mock adapter instead.
 *
 * @typedef {{
 *   count:          (table: string, userId: string, filter?: object) => Promise<number>,
 *   fetchOne:       (table: string, userId: string, column: string) => Promise<any>,
 *   fetchDistinct:  (table: string, userId: string, column: string) => Promise<string[]>,
 *   fetchTopN:      (table: string, n: number) => Promise<{ user_id: string }[]>,
 * }} DbAdapter
 */

// ─── Badge criteria map ───────────────────────────────────────────────────────

/**
 * Each key matches a badge slug.
 * Each function: (db, userId, metadata?) → Promise<boolean>
 */
export const BADGE_CRITERIA = {

  // ── Farming ──────────────────────────────────────────────────────────────

  "first-scan": async (db, userId) => {
    const n = await db.count("scan_logs", userId);
    return n >= 1;
  },

  "weather-wise": async (db, userId) => {
    const n = await db.count("weather_check_logs", userId);
    return n >= 5;
  },

  "harvest-hero": async (db, userId) => {
    const n = await db.count("harvest_logs", userId);
    return n >= 1;
  },

  "crop-master": async (db, userId) => {
    const crops = await db.fetchDistinct("user_crops", userId, "crop_type");
    return crops.length >= 5;
  },

  // ── Market ────────────────────────────────────────────────────────────────

  "market-watcher": async (db, userId) => {
    const n = await db.count("market_view_logs", userId);
    return n >= 10;
  },

  "top-seller": async (db, userId) => {
    const n = await db.count("product_listings", userId);
    return n >= 1;
  },

  /**
   * Price Prophet: sale price is within ±10% of the predicted peak price.
   * Requires metadata.salePrice and metadata.predictedPeak.
   */
  "price-prophet": async (_db, _userId, metadata) => {
    const salePrice     = Number(metadata?.salePrice);
    const predictedPeak = Number(metadata?.predictedPeak);
    if (!salePrice || !predictedPeak || predictedPeak <= 0) return false;
    const ratio = salePrice / predictedPeak;
    return ratio >= 0.9 && ratio <= 1.1;
  },

  // ── Social ────────────────────────────────────────────────────────────────

  "community-champion": async (db, userId) => {
    const n = await db.count("community_posts", userId);
    return n >= 5;
  },

  "social-butterfly": async (db, userId) => {
    const n = await db.count("farmer_connections", userId);
    return n >= 10;
  },

  // ── Learning ─────────────────────────────────────────────────────────────

  "knowledge-seeker": async (db, userId) => {
    const n = await db.count("article_read_logs", userId);
    return n >= 10;
  },

  // ── Milestones ────────────────────────────────────────────────────────────

  "green-streak": async (db, userId) => {
    const streak = await db.fetchOne("user_profiles", userId, "current_streak");
    return Number(streak) >= 7;
  },

  /**
   * Early Bird: user joined within the first 30 days of the app launch date.
   * Requires metadata.registeredAt (ISO string) and metadata.launchDate (ISO string).
   */
  "early-bird": async (_db, _userId, metadata) => {
    const registeredAt = new Date(metadata?.registeredAt ?? Date.now());
    const launchDate   = new Date(metadata?.launchDate   ?? "2026-04-15");
    const deadlineMs   = launchDate.getTime() + 30 * 24 * 60 * 60 * 1000;
    return registeredAt.getTime() <= deadlineMs;
  },

  "digital-farmer": async (db, userId) => {
    const completeness = await db.fetchOne("user_profiles", userId, "profile_completeness");
    return Number(completeness) >= 100;
  },

  "milestone-maker": async (db, userId) => {
    const xp = await db.fetchOne("user_profiles", userId, "total_xp");
    return Number(xp) >= 1000;
  },

  "legend": async (db, userId) => {
    const top10 = await db.fetchTopN("user_profiles", 10);
    return top10.some((row) => row.user_id === userId);
  },
};

// ─── Adapter builder (used in the real Edge Function) ─────────────────────────

/**
 * Wraps a Supabase client into the DbAdapter interface expected by BADGE_CRITERIA.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @returns {DbAdapter}
 */
export function buildSupabaseAdapter(supabase) {
  return {
    count: async (table, userId) => {
      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true })
        .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`);
      if (error) throw error;
      return count ?? 0;
    },

    fetchOne: async (table, userId, column) => {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data?.[column] ?? null;
    },

    fetchDistinct: async (table, userId, column) => {
      const { data, error } = await supabase
        .from(table)
        .select(column)
        .eq("user_id", userId);
      if (error) throw error;
      const unique = new Set((data ?? []).map((r) => r[column]));
      return [...unique];
    },

    fetchTopN: async (table, n) => {
      const { data, error } = await supabase
        .from(table)
        .select("user_id")
        .order("total_xp", { ascending: false })
        .limit(n);
      if (error) throw error;
      return data ?? [];
    },
  };
}
