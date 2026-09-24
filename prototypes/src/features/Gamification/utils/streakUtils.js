/**
 * utils/streakUtils.js
 *
 * Pure, timezone-aware streak calculation utilities.
 * No Supabase dependency — fully unit-testable.
 *
 * Key design: all calendar comparisons happen in the *user's local timezone*
 * (default: Asia/Kolkata / IST +5:30) so a login at 23:59 IST and the next
 * at 00:01 IST counts as consecutive days — not same-day UTC hackery.
 */

// ─── Core date helpers ────────────────────────────────────────────────────────

/**
 * Returns an ISO date string (YYYY-MM-DD) for a timestamp in the given IANA timezone.
 * Uses Intl — zero external dependencies.
 *
 * @param {Date|string|number} timestamp
 * @param {string} timezone   IANA timezone string, e.g. "Asia/Kolkata"
 * @returns {string}          e.g. "2026-05-19"
 */
export function toLocalDateString(timestamp, timezone = "Asia/Kolkata") {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone:  timezone,
    year:      "numeric",
    month:     "2-digit",
    day:       "2-digit",
  }).format(date);
}

/**
 * Returns the number of calendar days between two timestamps in the given timezone.
 * Always returns a non-negative integer; caller decides directionality.
 *
 * @param {Date|string} earlier
 * @param {Date|string} later
 * @param {string}      timezone
 * @returns {number}
 */
export function calendarDaysDiff(earlier, later, timezone = "Asia/Kolkata") {
  const a = new Date(toLocalDateString(earlier, timezone));
  const b = new Date(toLocalDateString(later,   timezone));
  // Difference in UTC midnight values — always whole days
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ─── Streak logic ─────────────────────────────────────────────────────────────

/**
 * @typedef {"increment" | "reset" | "unchanged"} StreakAction
 *
 * @typedef {{
 *   newStreak:    number,
 *   action:       StreakAction,
 *   daysDiff:     number,        // calendar days since last login (in user tz)
 * }} StreakResult
 */

/**
 * Calculates the updated streak given the user's last and current login timestamps.
 *
 * Rules:
 *   daysDiff = 0  → same calendar day → streak unchanged (multiple daily logins OK)
 *   daysDiff = 1  → consecutive day   → increment streak
 *   daysDiff ≥ 2  → gap detected      → reset to 1
 *   no last login → first-ever login  → start at 1
 *
 * @param {Date|string|null} lastLoginAt     Previous login (null = first ever)
 * @param {Date|string}      currentLoginAt  Login being processed
 * @param {string}           timezone        IANA tz string (default: Asia/Kolkata)
 * @param {number}           currentStreak   Existing streak count
 * @returns {StreakResult}
 */
export function calculateStreak(
  lastLoginAt,
  currentLoginAt,
  timezone      = "Asia/Kolkata",
  currentStreak = 0,
) {
  if (!lastLoginAt) {
    return { newStreak: 1, action: "increment", daysDiff: Infinity };
  }

  const daysDiff = calendarDaysDiff(lastLoginAt, currentLoginAt, timezone);

  if (daysDiff < 0) {
    // Current is *before* last — clock skew / replay; treat as same-day
    return { newStreak: currentStreak, action: "unchanged", daysDiff: 0 };
  }

  if (daysDiff === 0) {
    return { newStreak: currentStreak, action: "unchanged", daysDiff: 0 };
  }

  if (daysDiff === 1) {
    return { newStreak: currentStreak + 1, action: "increment", daysDiff: 1 };
  }

  // daysDiff >= 2: streak broken
  return { newStreak: 1, action: "reset", daysDiff };
}

// ─── Badge threshold helpers ──────────────────────────────────────────────────

/** Returns true if the streak qualifies for the Green Streak badge (≥ 7 days) */
export const meetsGreenStreakThreshold = (streak) => streak >= 7;

/**
 * Returns the streak milestone just crossed (if any) so callers can trigger
 * badge checks at the right moment.
 *
 * @param {number} prevStreak  streak before this login
 * @param {number} newStreak   streak after this login
 * @returns {number|null}      milestone crossed (e.g. 7, 30, 100) or null
 */
export function streakMilestoneCrossed(prevStreak, newStreak) {
  const MILESTONES = [7, 14, 30, 60, 100];
  for (const m of MILESTONES) {
    if (prevStreak < m && newStreak >= m) return m;
  }
  return null;
}

// ─── Supabase-coupled streak update (used in Edge Function / server) ──────────

/**
 * Applies streak logic to the user_profiles row.
 * Returns the mutation payload — *not* applied here (pure function).
 *
 * @param {{
 *   current_streak:   number,
 *   last_login_at:    string|null,
 *   user_timezone?:   string,
 * }} profile
 * @param {string} nowISO   ISO timestamp of the current login
 * @returns {{ current_streak: number, last_login_at: string, streak_action: StreakAction }}
 */
export function computeStreakUpdate(profile, nowISO = new Date().toISOString()) {
  const tz = profile.user_timezone ?? "Asia/Kolkata";
  const { newStreak, action } = calculateStreak(
    profile.last_login_at,
    nowISO,
    tz,
    profile.current_streak,
  );
  return {
    current_streak: newStreak,
    last_login_at:  nowISO,
    streak_action:  action,
  };
}
