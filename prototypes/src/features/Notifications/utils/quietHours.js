/**
 * src/features/Notifications/utils/quietHours.js
 *
 * Pure quiet-hours logic — determines whether a notification should be
 * suppressed because the user's local time falls within their quiet window.
 *
 * Design notes:
 *   - All comparisons are done in the USER's timezone (default: Asia/Kolkata)
 *   - Quiet windows that span midnight (e.g. 22:00–07:00) are handled correctly
 *   - Critical / SYSTEM notifications always bypass quiet hours
 *   - Uses Intl.DateTimeFormat — zero external dependencies
 *
 * IST offset: UTC+5:30 (no DST — stable year-round)
 */

import { NOTIFICATION_TYPE } from "../constants/notificationTypes";

// ─── Core time helpers ────────────────────────────────────────────────────────

/**
 * Returns { hours, minutes } for a timestamp in the given IANA timezone.
 *
 * @param {Date}   date
 * @param {string} timezone   e.g. "Asia/Kolkata"
 * @returns {{ hours: number, minutes: number }}
 */
export function getLocalTime(date, timezone = "Asia/Kolkata") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour:     "2-digit",
    minute:   "2-digit",
    hour12:   false,
  }).formatToParts(date);

  const h = parts.find((p) => p.type === "hour")?.value   ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";

  return {
    hours:   parseInt(h, 10),
    minutes: parseInt(m, 10),
  };
}

/**
 * Converts an "HH:MM" string to total minutes since midnight.
 *
 * @param {string} timeStr  "22:00" | "07:30"
 * @returns {number}
 */
export function timeStringToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) throw new Error(`Invalid time string: "${timeStr}"`);
  return h * 60 + m;
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Returns true if the given timestamp falls inside the user's quiet window.
 *
 * Supports windows that span midnight (start > end in minutes).
 * e.g. 22:00–07:00: quiet from 10 PM through 7 AM.
 *
 * @param {Date}   now           Current timestamp (injectable for testing)
 * @param {string} quietStart    "HH:MM" quiet window start (user's local time)
 * @param {string} quietEnd      "HH:MM" quiet window end   (user's local time)
 * @param {string} timezone      IANA timezone string
 * @returns {boolean}
 */
export function isInQuietHours(
  now,
  quietStart = "22:00",
  quietEnd   = "07:00",
  timezone   = "Asia/Kolkata",
) {
  const { hours, minutes } = getLocalTime(now, timezone);
  const currentMins = hours * 60 + minutes;
  const startMins   = timeStringToMinutes(quietStart);
  const endMins     = timeStringToMinutes(quietEnd);

  if (startMins === endMins) {
    // Degenerate window (zero duration) — never quiet
    return false;
  }

  if (startMins > endMins) {
    // Spans midnight: quiet if current >= start OR current < end
    // Example: 22:00-07:00 at 23:30 → 1410 >= 1320 → true (quiet)
    // Example: 22:00-07:00 at 06:30 → 390 < 420 → true (quiet)
    // Example: 22:00-07:00 at 07:00 → 420 < 420 is false, 420 >= 1320 is false → false (not quiet)
    return currentMins >= startMins || currentMins < endMins;
  }

  // Same-day window: quiet if start <= current < end
  return currentMins >= startMins && currentMins < endMins;
}

// ─── Notification-level gate ──────────────────────────────────────────────────

/**
 * @typedef {{
 *   shouldSend: boolean,
 *   reason:     string,
 * }} QuietHoursResult
 */

/**
 * Returns whether a notification should be suppressed due to quiet hours.
 *
 * SYSTEM notifications always bypass quiet hours (critical alerts).
 *
 * @param {{
 *   type:       string,
 *   urgent?:    boolean,   // set true for time-sensitive alerts (e.g. flash sale)
 * }} notification
 * @param {{
 *   quiet_hours_enabled: boolean,
 *   quiet_start:         string,
 *   quiet_end:           string,
 *   timezone:            string,
 * }} preferences
 * @param {Date} [now]  injectable for testing
 * @returns {QuietHoursResult}
 */
export function checkQuietHours(notification, preferences, now = new Date()) {
  // System or urgent notifications bypass quiet hours entirely
  if (notification.type === NOTIFICATION_TYPE.SYSTEM || notification.urgent) {
    return { shouldSend: true, reason: "system_bypasses_quiet_hours" };
  }

  // Quiet hours feature not enabled for this user
  if (!preferences.quiet_hours_enabled) {
    return { shouldSend: true, reason: "quiet_hours_not_enabled" };
  }

  const quiet = isInQuietHours(
    now,
    preferences.quiet_start ?? "22:00",
    preferences.quiet_end   ?? "07:00",
    preferences.timezone    ?? "Asia/Kolkata",
  );

  return quiet
    ? { shouldSend: false, reason: "quiet_hours_active" }
    : { shouldSend: true,  reason: "outside_quiet_hours" };
}
