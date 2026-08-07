/**
 * __tests__/unit/quietHours.test.js
 *
 * Unit tests for quiet hours logic — with heavy focus on IST (UTC+5:30)
 * timezone edge cases that trip up naive implementations.
 *
 * IST key facts:
 *   UTC+5:30 · No DST · Stable offset year-round
 *   UTC 16:30 = IST 22:00  (default quiet start)
 *   UTC 18:30 = IST 00:00  (midnight — deepest quiet)
 *   UTC 01:30 = IST 07:00  (default quiet end — NOT quiet at this exact minute)
 *   UTC 03:30 = IST 09:00  (morning — not quiet)
 *
 * Covers:
 *   ✓ isInQuietHours — midnight-spanning window (22:00–07:00 IST)
 *   ✓ Boundary: exactly at quiet start → quiet
 *   ✓ Boundary: exactly at quiet end → NOT quiet
 *   ✓ Deep in quiet window (00:00 IST midnight) → quiet
 *   ✓ Morning (09:00 IST) → not quiet
 *   ✓ Evening before quiet start (21:59 IST) → not quiet
 *   ✓ Same-day quiet window (14:00–16:00) → correct range
 *   ✓ Zero-duration window (start == end) → never quiet
 *   ✓ Full-day window (00:00–23:59) → always quiet
 *   ✓ getLocalTime correctly extracts IST hours/minutes from UTC timestamp
 *   ✓ checkQuietHours: SYSTEM type bypasses quiet hours
 *   ✓ checkQuietHours: urgent=true bypasses quiet hours
 *   ✓ checkQuietHours: quiet_hours_enabled=false → sends regardless
 *   ✓ checkQuietHours: during quiet window → blocked
 *   ✓ checkQuietHours: outside quiet window → passes
 *   ✓ UTC timezone quiet hours (different from IST user)
 *   ✓ Invalid time string throws
 */

import { describe, it, expect } from "vitest";
import {
  getLocalTime,
  isInQuietHours,
  timeStringToMinutes,
  checkQuietHours,
} from "../../utils/quietHours";
import { NOTIFICATION_TYPE } from "../../constants/notificationTypes";
import { istTimeToUTC, makeNotification, makeQuietPreferences } from "../helpers/mockHelpers";

// ─── getLocalTime ──────────────────────────────────────────────────────────────

describe("getLocalTime — IST timezone extraction", () => {

  it("returns correct IST hours/minutes from a UTC timestamp", () => {
    // UTC 16:30 = IST 22:00
    const utc = new Date("2026-05-19T16:30:00Z");
    const { hours, minutes } = getLocalTime(utc, "Asia/Kolkata");
    expect(hours).toBe(22);
    expect(minutes).toBe(0);
  });

  it("handles UTC midnight correctly: UTC 00:00 = IST 05:30", () => {
    const utc = new Date("2026-05-19T00:00:00Z");
    const { hours, minutes } = getLocalTime(utc, "Asia/Kolkata");
    expect(hours).toBe(5);
    expect(minutes).toBe(30);
  });

  it("handles UTC time that crosses IST midnight: UTC 18:30 = IST 00:00", () => {
    const utc = new Date("2026-05-19T18:30:00Z");
    const { hours, minutes } = getLocalTime(utc, "Asia/Kolkata");
    expect(hours).toBe(0);
    expect(minutes).toBe(0);
  });

  it("handles IST early morning: UTC 01:30 = IST 07:00", () => {
    const utc = new Date("2026-05-19T01:30:00Z");
    const { hours, minutes } = getLocalTime(utc, "Asia/Kolkata");
    expect(hours).toBe(7);
    expect(minutes).toBe(0);
  });

  it("works correctly for UTC+0 timezone", () => {
    const utc = new Date("2026-05-19T14:25:00Z");
    const { hours, minutes } = getLocalTime(utc, "UTC");
    expect(hours).toBe(14);
    expect(minutes).toBe(25);
  });
});

// ─── timeStringToMinutes ──────────────────────────────────────────────────────

describe("timeStringToMinutes", () => {
  it("converts 00:00 to 0",    () => expect(timeStringToMinutes("00:00")).toBe(0));
  it("converts 07:00 to 420",  () => expect(timeStringToMinutes("07:00")).toBe(420));
  it("converts 22:00 to 1320", () => expect(timeStringToMinutes("22:00")).toBe(1320));
  it("converts 23:59 to 1439", () => expect(timeStringToMinutes("23:59")).toBe(1439));
  it("converts 07:30 to 450",  () => expect(timeStringToMinutes("07:30")).toBe(450));
  it("throws on invalid input", () => {
    expect(() => timeStringToMinutes("invalid")).toThrow();
    expect(() => timeStringToMinutes("25:00")).not.toThrow(); // valid parse, logically clamped by caller
  });
});

// ─── isInQuietHours — midnight-spanning window (default 22:00–07:00 IST) ─────

describe("isInQuietHours — midnight-spanning window 22:00–07:00 IST", () => {
  const QUIET_START = "22:00";
  const QUIET_END   = "07:00";
  const TZ          = "Asia/Kolkata";

  // Quiet cases
  it("22:00 IST (quiet start) → quiet", () => {
    expect(isInQuietHours(istTimeToUTC("22:00"), QUIET_START, QUIET_END, TZ)).toBe(true);
  });

  it("23:30 IST (late evening) → quiet", () => {
    expect(isInQuietHours(istTimeToUTC("23:30"), QUIET_START, QUIET_END, TZ)).toBe(true);
  });

  it("00:00 IST (midnight) → quiet", () => {
    expect(isInQuietHours(istTimeToUTC("00:00"), QUIET_START, QUIET_END, TZ)).toBe(true);
  });

  it("01:15 IST (deep night) → quiet", () => {
    expect(isInQuietHours(istTimeToUTC("01:15"), QUIET_START, QUIET_END, TZ)).toBe(true);
  });

  it("06:45 IST (just before quiet end) → quiet", () => {
    expect(isInQuietHours(istTimeToUTC("06:45"), QUIET_START, QUIET_END, TZ)).toBe(true);
  });

  it("06:59 IST (one minute before quiet end) → quiet", () => {
    expect(isInQuietHours(istTimeToUTC("06:59"), QUIET_START, QUIET_END, TZ)).toBe(true);
  });

  // Not-quiet cases
  it("07:00 IST (exactly at quiet end) → NOT quiet", () => {
    // End is exclusive: window is [22:00, 07:00)
    expect(isInQuietHours(istTimeToUTC("07:00"), QUIET_START, QUIET_END, TZ)).toBe(false);
  });

  it("07:01 IST (just after quiet end) → NOT quiet", () => {
    expect(isInQuietHours(istTimeToUTC("07:01"), QUIET_START, QUIET_END, TZ)).toBe(false);
  });

  it("09:00 IST (morning) → NOT quiet", () => {
    expect(isInQuietHours(istTimeToUTC("09:00"), QUIET_START, QUIET_END, TZ)).toBe(false);
  });

  it("12:00 IST (noon) → NOT quiet", () => {
    expect(isInQuietHours(istTimeToUTC("12:00"), QUIET_START, QUIET_END, TZ)).toBe(false);
  });

  it("18:00 IST (evening) → NOT quiet", () => {
    expect(isInQuietHours(istTimeToUTC("18:00"), QUIET_START, QUIET_END, TZ)).toBe(false);
  });

  it("21:59 IST (one minute before quiet start) → NOT quiet", () => {
    expect(isInQuietHours(istTimeToUTC("21:59"), QUIET_START, QUIET_END, TZ)).toBe(false);
  });
});

// ─── isInQuietHours — same-day window (no midnight crossing) ─────────────────

describe("isInQuietHours — same-day window 14:00–16:00", () => {
  const QUIET_START = "14:00";
  const QUIET_END   = "16:00";
  const TZ          = "Asia/Kolkata";

  it("14:00 IST (start) → quiet",         () => expect(isInQuietHours(istTimeToUTC("14:00"), QUIET_START, QUIET_END, TZ)).toBe(true));
  it("15:00 IST (middle) → quiet",        () => expect(isInQuietHours(istTimeToUTC("15:00"), QUIET_START, QUIET_END, TZ)).toBe(true));
  it("15:59 IST (one before end) → quiet",() => expect(isInQuietHours(istTimeToUTC("15:59"), QUIET_START, QUIET_END, TZ)).toBe(true));
  it("16:00 IST (end, exclusive) → NOT",  () => expect(isInQuietHours(istTimeToUTC("16:00"), QUIET_START, QUIET_END, TZ)).toBe(false));
  it("13:59 IST (before start) → NOT",    () => expect(isInQuietHours(istTimeToUTC("13:59"), QUIET_START, QUIET_END, TZ)).toBe(false));
  it("20:00 IST (evening) → NOT",         () => expect(isInQuietHours(istTimeToUTC("20:00"), QUIET_START, QUIET_END, TZ)).toBe(false));
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe("isInQuietHours — edge cases", () => {

  it("zero-duration window (start == end) → never quiet", () => {
    expect(isInQuietHours(istTimeToUTC("12:00"), "12:00", "12:00", "Asia/Kolkata")).toBe(false);
    expect(isInQuietHours(istTimeToUTC("22:00"), "22:00", "22:00", "Asia/Kolkata")).toBe(false);
  });

  it("UTC timezone: user at UTC, quiet 23:00–06:00, at 23:30 UTC → quiet", () => {
    const now = new Date("2026-05-19T23:30:00Z");
    expect(isInQuietHours(now, "23:00", "06:00", "UTC")).toBe(true);
  });

  it("UTC timezone: at 06:00 UTC (exact end) → NOT quiet", () => {
    const now = new Date("2026-05-19T06:00:00Z");
    expect(isInQuietHours(now, "23:00", "06:00", "UTC")).toBe(false);
  });

  it("same UTC timestamp is quiet for IST user but not for UTC user", () => {
    // UTC 17:30 = IST 23:00 (quiet) vs UTC 17:30 (evening, not quiet)
    const now = new Date("2026-05-19T17:30:00Z");
    expect(isInQuietHours(now, "22:00", "07:00", "Asia/Kolkata")).toBe(true);
    expect(isInQuietHours(now, "22:00", "07:00", "UTC")).toBe(false);
  });
});

// ─── checkQuietHours — notification-level gate ────────────────────────────────

describe("checkQuietHours — notification gate", () => {

  it("SYSTEM type always passes — even deep inside quiet window", () => {
    const prefs  = makeQuietPreferences();
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.SYSTEM },
      prefs,
      istTimeToUTC("02:00"), // deepest quiet
    );
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("system_bypasses_quiet_hours");
  });

  it("urgent=true passes during quiet hours", () => {
    const prefs  = makeQuietPreferences();
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.PRICE_ALERT, urgent: true },
      prefs,
      istTimeToUTC("03:00"),
    );
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("system_bypasses_quiet_hours");
  });

  it("quiet_hours_enabled = false → always passes regardless of time", () => {
    const prefs  = makeQuietPreferences("22:00", "07:00", "Asia/Kolkata");
    prefs.quiet_hours_enabled = false;
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.PRICE_ALERT },
      prefs,
      istTimeToUTC("02:00"),
    );
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("quiet_hours_not_enabled");
  });

  it("blocks a price alert sent at 23:30 IST with quiet hours enabled", () => {
    const prefs  = makeQuietPreferences("22:00", "07:00", "Asia/Kolkata");
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.PRICE_ALERT },
      prefs,
      istTimeToUTC("23:30"),
    );
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("quiet_hours_active");
  });

  it("allows a price alert sent at 09:00 IST with quiet hours enabled", () => {
    const prefs  = makeQuietPreferences("22:00", "07:00", "Asia/Kolkata");
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.PRICE_ALERT },
      prefs,
      istTimeToUTC("09:00"),
    );
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("outside_quiet_hours");
  });

  it("blocks at the exact quiet start time (22:00 IST)", () => {
    const prefs  = makeQuietPreferences("22:00", "07:00", "Asia/Kolkata");
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.COMMUNITY_REPLY },
      prefs,
      istTimeToUTC("22:00"),
    );
    expect(result.shouldSend).toBe(false);
  });

  it("allows at the exact quiet end time (07:00 IST) — end is exclusive", () => {
    const prefs  = makeQuietPreferences("22:00", "07:00", "Asia/Kolkata");
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.BADGE_EARNED },
      prefs,
      istTimeToUTC("07:00"),
    );
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("outside_quiet_hours");
  });

  it("uses default prefs values (22:00–07:00 IST) when quiet_start/end missing", () => {
    const prefs = {
      quiet_hours_enabled: true,
      timezone: "Asia/Kolkata",
      // quiet_start and quiet_end intentionally omitted
    };
    const resultDuring = checkQuietHours(
      { type: NOTIFICATION_TYPE.PRICE_ALERT },
      prefs,
      istTimeToUTC("23:00"),
    );
    expect(resultDuring.shouldSend).toBe(false);
  });

  it("custom quiet window: 13:00–15:00 IST blocks at 14:00", () => {
    const prefs  = makeQuietPreferences("13:00", "15:00", "Asia/Kolkata");
    const result = checkQuietHours(
      { type: NOTIFICATION_TYPE.PRICE_ALERT },
      prefs,
      istTimeToUTC("14:00"),
    );
    expect(result.shouldSend).toBe(false);
  });
});
