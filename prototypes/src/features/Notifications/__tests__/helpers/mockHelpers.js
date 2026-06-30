/**
 * src/features/Notifications/__tests__/helpers/mockFCM.js
 *
 * Mock helpers for FCM, React Navigation, and notification test data factories.
 * Used across all notification test files.
 */

import { vi } from "vitest";
import { v4 as uuidv4 } from "uuid";

// ─── FCM mock ──────────────────────────────────────────────────────────────────

/**
 * Creates a mock for the FCM REST API (fetch to googleapis.com).
 * Records every call so tests can assert on payload, count, and tokens.
 */
export function createFCMMock() {
  const calls = [];

  const mockFetch = vi.fn(async (url, options) => {
    if (!url.includes("fcm.googleapis.com")) {
      // Let non-FCM calls through unchanged
      return global.__originalFetch?.(url, options);
    }

    const body = JSON.parse(options?.body ?? "{}");
    calls.push({
      url,
      token:        body.to ?? body.registration_ids?.[0],
      title:        body.notification?.title,
      body:         body.notification?.body,
      data:         body.data ?? {},
      timestamp:    new Date().toISOString(),
    });

    // Default: success
    return {
      ok:   true,
      json: async () => ({ success: 1, failure: 0, results: [{ message_id: `msg-${uuidv4()}` }] }),
      text: async () => JSON.stringify({ success: 1 }),
    };
  });

  return {
    /** The vi.fn() to install as global.fetch */
    fetch:       mockFetch,
    /** All recorded FCM calls */
    calls,
    /** Convenience: calls filtered to a specific token */
    callsTo:     (token) => calls.filter((c) => c.token === token),
    /** Convenience: calls filtered to a specific notification type */
    callsOfType: (type) => calls.filter((c) => c.data?.type === type),
    /** Reset call history between tests */
    reset:       () => calls.splice(0, calls.length),
    /** Make the next FCM call fail (simulate FCM 500) */
    failNext:    () => {
      mockFetch.mockResolvedValueOnce({
        ok:   false,
        json: async () => ({ success: 0, failure: 1, results: [{ error: "Unavailable" }] }),
        text: async () => JSON.stringify({ success: 0, failure: 1 }),
      });
    },
  };
}

// ─── React Navigation mock ────────────────────────────────────────────────────

/**
 * Creates a mock navigation object for deep link tests.
 * Captures navigate() calls so tests can assert on screen + params.
 */
export function createNavigationMock() {
  const calls = [];

  const navigate = vi.fn((screen, params) => {
    calls.push({ screen, params: params ?? {} });
  });

  const reset = vi.fn();
  const dispatch = vi.fn();

  return {
    navigate,
    reset,
    dispatch,
    calls,
    /** Last navigation call */
    lastCall: () => calls[calls.length - 1] ?? null,
    /** All calls to a specific screen */
    callsTo:  (screen) => calls.filter((c) => c.screen === screen),
    /** Reset call history */
    clear:    () => calls.splice(0, calls.length),
  };
}

// ─── Notification factories ───────────────────────────────────────────────────

export function makeNotification(overrides = {}) {
  return {
    id:      uuidv4(),
    type:    "price_alert",
    userId:  `user-${uuidv4()}`,
    data:    {},
    urgent:  false,
    sentAt:  new Date().toISOString(),
    ...overrides,
  };
}

export function makePriceAlertNotification(overrides = {}) {
  return makeNotification({
    type: "price_alert",
    data: {
      commodity:    "wheat",
      commodity_id: "crop-wheat-001",
      mandi_id:     "mandi-ahmedabad-01",
      price:        2450,
      ...overrides.data,
    },
    ...overrides,
  });
}

export function makeBadgeNotification(overrides = {}) {
  return makeNotification({
    type: "badge_earned",
    data: {
      badge_id:   "first-scan",
      badge_name: "First Scan",
      xp_reward:  50,
      ...overrides.data,
    },
    ...overrides,
  });
}

export function makeCommunityReplyNotification(overrides = {}) {
  return makeNotification({
    type: "community_reply",
    data: {
      post_id:     `post-${uuidv4()}`,
      reply_id:    `reply-${uuidv4()}`,
      author_name: "Suresh Patel",
      ...overrides.data,
    },
    ...overrides,
  });
}

export function makeSystemNotification(overrides = {}) {
  return makeNotification({
    type:   "system",
    urgent: true,
    data:   { message: "Scheduled maintenance at 2 AM IST" },
    ...overrides,
  });
}

// ─── Preference factories ─────────────────────────────────────────────────────

export function makePreferences(overrides = {}) {
  return {
    all_disabled:        false,
    price_alerts:        true,
    badges:              true,
    community:           true,
    leaderboard:         true,
    weekly_summary:      true,
    streak_reminders:    true,
    rate_app:            true,
    quiet_hours_enabled: false,
    quiet_start:         "22:00",
    quiet_end:           "07:00",
    timezone:            "Asia/Kolkata",
    ...overrides,
  };
}

/** Makes preferences with quiet hours enabled, spanning midnight (default IST window) */
export function makeQuietPreferences(start = "22:00", end = "07:00", tz = "Asia/Kolkata") {
  return makePreferences({
    quiet_hours_enabled: true,
    quiet_start:         start,
    quiet_end:           end,
    timezone:            tz,
  });
}

// ─── Time helpers for tests ────────────────────────────────────────────────────

/**
 * Creates a Date from a "HH:MM" string interpreted as IST (UTC+5:30).
 * Useful for driving quiet hours tests with precise timestamps.
 *
 * @param {string} istTime  "HH:MM", e.g. "23:30" or "06:45"
 * @param {string} [dateStr] ISO date string, defaults to today
 * @returns {Date} UTC Date whose IST representation equals istTime
 */
export function istTimeToUTC(istTime, dateStr) {
  const base = dateStr ? new Date(dateStr) : new Date();
  const [h, m] = istTime.split(":").map(Number);
  // IST = UTC + 5h 30m  →  UTC = IST - 5h 30m
  const utcH = h - 5;
  const utcM = m - 30;
  const d = new Date(base);
  d.setUTCHours(utcH, utcM, 0, 0);
  return d;
}
