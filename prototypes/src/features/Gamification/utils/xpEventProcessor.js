/**
 * utils/xpEventProcessor.js
 *
 * XP event processing with idempotent deduplication.
 *
 * Every XP-granting action produces a unique `eventId` (UUID v4 generated
 * client-side and stamped on the request). The `xp_events` table's UNIQUE
 * constraint on `id` makes re-processing the same event a no-op, so retries
 * and race conditions can never double-count XP.
 *
 * Usage:
 *   const result = await processXPEvent(supabase, {
 *     eventId:   "uuid-v4",
 *     userId:    "user-uuid",
 *     action:    "scan",
 *     xpAmount:  10,
 *     metadata?: { cropType: "wheat" },
 *   });
 *
 *   if (result.skipped) console.log("duplicate:", result.reason);
 *   else console.log("XP granted:", result.xpGranted);
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Postgres unique violation error code */
const PG_UNIQUE_VIOLATION = "23505";

/** XP rewards per action (single source of truth) */
export const XP_REWARDS = {
  scan:                    10,
  market_view:              2,
  community_post:          15,
  article_read:             5,
  weather_check:            2,
  harvest_logged:          20,
  product_listed:          25,
  sale_completed:          30,
  farmer_connected:         5,
  crop_added:              10,
  profile_updated:          5,
  login_streak_day:         3,   // per streak day maintained
  leaderboard_rank_updated:  0,  // no XP — just triggers badge check
};

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   eventId:    string,               // UUID v4 — idempotency key
 *   userId:     string,
 *   action:     string,               // one of XP_REWARDS keys
 *   xpAmount:   number,
 *   metadata?:  Record<string,unknown>,
 * }} XPEventInput
 *
 * @typedef {{
 *   skipped:    true,
 *   reason:     "duplicate_event" | "zero_xp_action",
 * } | {
 *   skipped:    false,
 *   xpGranted:  number,
 *   eventId:    string,
 * }} XPEventResult
 */

// ─── Core processor ───────────────────────────────────────────────────────────

/**
 * Processes a single XP event with deduplication.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {XPEventInput} input
 * @returns {Promise<XPEventResult>}
 */
export async function processXPEvent(supabase, { eventId, userId, action, xpAmount, metadata = {} }) {
  // Skip actions that carry no XP (e.g. leaderboard_rank_updated)
  if (xpAmount === 0) {
    return { skipped: true, reason: "zero_xp_action" };
  }

  // ── 1. Attempt to record the event (UNIQUE on id prevents duplicates) ──────
  const { error: insertErr } = await supabase
    .from("xp_events")
    .insert({
      id:         eventId,
      user_id:    userId,
      action,
      xp_amount:  xpAmount,
      metadata,
      created_at: new Date().toISOString(),
    });

  if (insertErr) {
    if (insertErr.code === PG_UNIQUE_VIOLATION) {
      // Already processed — safe to return skipped
      return { skipped: true, reason: "duplicate_event" };
    }
    throw insertErr; // unexpected DB error — propagate
  }

  // ── 2. Grant the XP (atomic RPC so concurrent calls don't race) ───────────
  const { error: xpErr } = await supabase.rpc("increment_user_xp", {
    p_user_id: userId,
    p_amount:  xpAmount,
  });

  if (xpErr) {
    // Compensate: delete the event row so the caller can retry
    await supabase.from("xp_events").delete().eq("id", eventId);
    throw xpErr;
  }

  return { skipped: false, xpGranted: xpAmount, eventId };
}

// ─── Batch processor ──────────────────────────────────────────────────────────

/**
 * Processes multiple XP events in series, collecting results.
 * Deduplication still applies per-event.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {XPEventInput[]} events
 * @returns {Promise<{ totalGranted: number, results: XPEventResult[] }>}
 */
export async function processBatchXPEvents(supabase, events) {
  const results = [];
  let totalGranted = 0;

  for (const event of events) {
    const result = await processXPEvent(supabase, event);
    results.push(result);
    if (!result.skipped) totalGranted += result.xpGranted;
  }

  return { totalGranted, results };
}

// ─── Leaderboard rank computation ─────────────────────────────────────────────

/**
 * Given a sorted list of user XP totals, returns the 1-based rank for a userId.
 * Handles ties via DENSE_RANK semantics (same XP = same rank, no gaps).
 *
 * @param {{ userId: string, xp: number }[]} rankedUsers  descending by xp
 * @param {string}                           targetUserId
 * @returns {number}  1-based rank, or -1 if user not found
 */
export function computeRank(rankedUsers, targetUserId) {
  let currentRank = 1;
  let prevXp = null;

  for (let i = 0; i < rankedUsers.length; i++) {
    const { userId, xp } = rankedUsers[i];

    if (prevXp !== null && xp < prevXp) {
      currentRank = i + 1;
    }

    if (userId === targetUserId) return currentRank;
    prevXp = xp;
  }

  return -1;
}

/**
 * Returns the XP needed to move up one rank, or 0 if already rank #1.
 *
 * @param {{ userId: string, xp: number }[]} rankedUsers  descending by xp
 * @param {string}                           targetUserId
 * @returns {number}
 */
export function xpGapToNextRank(rankedUsers, targetUserId) {
  const idx = rankedUsers.findIndex((u) => u.userId === targetUserId);
  if (idx <= 0) return 0; // already #1 or not found

  const myXP   = rankedUsers[idx].xp;
  const aboveXP = rankedUsers[idx - 1].xp;

  return Math.max(aboveXP - myXP, 0);
}
