/**
 * __tests__/unit/streakCalculation.test.js
 *
 * Unit tests for streak day calculation — especially timezone edge cases.
 * All tests are purely synchronous; no mocks needed.
 *
 * IST = Asia/Kolkata = UTC+5:30 (no DST — stable offset year-round)
 * UTC = Europe/London (varies with BST — good for DST edge cases)
 *
 * Covers:
 *   ✓ First login ever → streak = 1
 *   ✓ Same calendar day (multiple daily logins) → streak unchanged
 *   ✓ Consecutive calendar days → streak increments
 *   ✓ Gap of 2+ days → streak resets to 1
 *   ✓ Streak resets to 1, not 0
 *   ✓ IST midnight: login at 23:50 IST + login at 00:10 IST next day (20 min apart) → increment
 *   ✓ IST midnight: login at 23:50 UTC Mon → 18:20 IST Tue = consecutive IST day
 *   ✓ Login 25 hours apart across IST midnight → consecutive calendar days
 *   ✓ Login 23 hours apart, same IST calendar day → unchanged
 *   ✓ UTC+0 user vs IST user: same timestamps, different streak outcomes
 *   ✓ Negative daysDiff (clock skew / replay) → unchanged
 *   ✓ Green Streak badge threshold (≥ 7 days)
 *   ✓ Streak milestone detection (7, 14, 30)
 *   ✓ computeStreakUpdate returns correct mutation payload
 */

import { describe, it, expect } from "vitest";
import {
  toLocalDateString,
  calendarDaysDiff,
  calculateStreak,
  meetsGreenStreakThreshold,
  streakMilestoneCrossed,
  computeStreakUpdate,
} from "../../utils/streakUtils";

// ─── toLocalDateString ────────────────────────────────────────────────────────

describe("toLocalDateString", () => {
  it("converts a UTC midnight timestamp to IST date correctly", () => {
    // 2026-05-18 00:00 UTC = 2026-05-18 05:30 IST → date: 2026-05-18
    expect(toLocalDateString(new Date("2026-05-18T00:00:00Z"), "Asia/Kolkata"))
      .toBe("2026-05-18");
  });

  it("handles the IST midnight case: 18:30 UTC = 00:00 IST next day", () => {
    // 2026-05-18 18:30 UTC = 2026-05-19 00:00 IST → date: 2026-05-19
    expect(toLocalDateString(new Date("2026-05-18T18:30:00Z"), "Asia/Kolkata"))
      .toBe("2026-05-19");
  });

  it("handles a timestamp just before IST midnight: 18:29 UTC = 23:59 IST same day", () => {
    // 2026-05-18 18:29 UTC = 2026-05-18 23:59 IST → date: 2026-05-18
    expect(toLocalDateString(new Date("2026-05-18T18:29:00Z"), "Asia/Kolkata"))
      .toBe("2026-05-18");
  });

  it("formats correctly for UTC (Europe/London, non-DST period)", () => {
    expect(toLocalDateString(new Date("2026-01-15T23:00:00Z"), "Europe/London"))
      .toBe("2026-01-15");
  });
});

// ─── calendarDaysDiff ─────────────────────────────────────────────────────────

describe("calendarDaysDiff", () => {
  it("returns 0 for two timestamps on the same IST calendar day", () => {
    const morning = new Date("2026-05-18T02:00:00Z"); // 07:30 IST
    const evening = new Date("2026-05-18T14:00:00Z"); // 19:30 IST
    expect(calendarDaysDiff(morning, evening, "Asia/Kolkata")).toBe(0);
  });

  it("returns 1 for timestamps on consecutive IST calendar days", () => {
    const day1 = new Date("2026-05-18T18:00:00Z"); // 23:30 IST May 18
    const day2 = new Date("2026-05-18T19:00:00Z"); // 00:30 IST May 19 — only 1h later!
    expect(calendarDaysDiff(day1, day2, "Asia/Kolkata")).toBe(1);
  });

  it("returns 2 for timestamps two IST calendar days apart", () => {
    const day1 = new Date("2026-05-17T00:00:00Z"); // May 17 IST
    const day3 = new Date("2026-05-19T00:00:00Z"); // May 19 IST
    expect(calendarDaysDiff(day1, day3, "Asia/Kolkata")).toBe(2);
  });
});

// ─── calculateStreak — basic logic ────────────────────────────────────────────

describe("calculateStreak — basic logic", () => {
  it("starts streak at 1 for a user's first ever login", () => {
    const result = calculateStreak(null, "2026-05-18T10:00:00Z");
    expect(result.newStreak).toBe(1);
    expect(result.action).toBe("increment");
  });

  it("increments streak on consecutive calendar days", () => {
    const last    = "2026-05-17T10:00:00Z"; // May 17 IST
    const current = "2026-05-18T10:00:00Z"; // May 18 IST
    const result  = calculateStreak(last, current, "Asia/Kolkata", 3);
    expect(result.newStreak).toBe(4);
    expect(result.action).toBe("increment");
    expect(result.daysDiff).toBe(1);
  });

  it("does NOT change streak for multiple logins on the same calendar day", () => {
    const first  = "2026-05-18T04:00:00Z"; // morning IST
    const second = "2026-05-18T14:00:00Z"; // evening IST
    const result = calculateStreak(first, second, "Asia/Kolkata", 5);
    expect(result.newStreak).toBe(5);
    expect(result.action).toBe("unchanged");
    expect(result.daysDiff).toBe(0);
  });

  it("resets streak to 1 after missing a day (gap = 2 days)", () => {
    const last    = "2026-05-15T10:00:00Z";
    const current = "2026-05-17T10:00:00Z"; // 2 days later
    const result  = calculateStreak(last, current, "Asia/Kolkata", 10);
    expect(result.newStreak).toBe(1);
    expect(result.action).toBe("reset");
    expect(result.daysDiff).toBe(2);
  });

  it("resets streak to 1 (not 0) after a long absence", () => {
    const last    = "2026-01-01T00:00:00Z";
    const current = "2026-05-18T00:00:00Z";
    const result  = calculateStreak(last, current, "Asia/Kolkata", 45);
    expect(result.newStreak).toBe(1);
    expect(result.action).toBe("reset");
  });

  it("handles currentStreak=0 correctly on first increment", () => {
    const last    = "2026-05-17T10:00:00Z";
    const current = "2026-05-18T10:00:00Z";
    const result  = calculateStreak(last, current, "Asia/Kolkata", 0);
    expect(result.newStreak).toBe(1);
    expect(result.action).toBe("increment");
  });
});

// ─── Timezone edge cases (IST +5:30) ──────────────────────────────────────────

describe("calculateStreak — IST timezone edge cases", () => {

  it("counts logins 20 minutes apart across IST midnight as consecutive days", () => {
    // 23:50 IST on May 18 = 18:20 UTC May 18
    const lastLogin    = "2026-05-18T18:20:00Z";
    // 00:10 IST on May 19 = 18:40 UTC May 18 (only 20 min later UTC!)
    const currentLogin = "2026-05-18T18:40:00Z";

    const result = calculateStreak(lastLogin, currentLogin, "Asia/Kolkata", 6);

    expect(result.newStreak).toBe(7);
    expect(result.action).toBe("increment");
    expect(result.daysDiff).toBe(1); // DIFFERENT IST calendar days
  });

  it("does NOT increment for two logins on the same IST day (even if 23h apart)", () => {
    // 00:30 IST May 18 = 19:00 UTC May 17
    const firstLogin   = "2026-05-17T19:00:00Z";
    // 23:30 IST May 18 = 18:00 UTC May 18 — 23h later, but same IST calendar day
    const secondLogin  = "2026-05-18T18:00:00Z";

    const result = calculateStreak(firstLogin, secondLogin, "Asia/Kolkata", 3);

    expect(result.action).toBe("unchanged");
    expect(result.newStreak).toBe(3);
  });

  it("counts login at 18:31 UTC (00:01 IST next day) as the next calendar day", () => {
    // Last login: 05:30 UTC May 17 = 11:00 IST May 17
    const lastLogin    = "2026-05-17T05:30:00Z";
    // Current: 18:31 UTC May 17 = 00:01 IST May 18
    const currentLogin = "2026-05-17T18:31:00Z";

    const result = calculateStreak(lastLogin, currentLogin, "Asia/Kolkata", 2);

    expect(result.newStreak).toBe(3);
    expect(result.action).toBe("increment");
  });

  it("correctly treats 25-hour gap across IST midnight as consecutive", () => {
    // May 17 22:00 IST = 16:30 UTC May 17
    const lastLogin    = "2026-05-17T16:30:00Z";
    // May 18 23:00 IST (25h later) = 17:30 UTC May 18
    const currentLogin = "2026-05-18T17:30:00Z";

    const result = calculateStreak(lastLogin, currentLogin, "Asia/Kolkata", 4);

    expect(result.newStreak).toBe(5);
    expect(result.action).toBe("increment");
    expect(result.daysDiff).toBe(1);
  });

  it("resets streak when gap is exactly 2 IST calendar days despite 49h UTC gap", () => {
    // May 17 00:01 IST = May 16 18:31 UTC
    const lastLogin    = "2026-05-16T18:31:00Z";
    // May 19 00:01 IST = May 18 18:31 UTC (exactly 48h later → 2 IST days gap)
    const currentLogin = "2026-05-18T18:31:00Z";

    const result = calculateStreak(lastLogin, currentLogin, "Asia/Kolkata", 8);

    expect(result.newStreak).toBe(1);
    expect(result.action).toBe("reset");
    expect(result.daysDiff).toBe(2);
  });
});

// ─── Timezone comparison: IST vs UTC ─────────────────────────────────────────

describe("calculateStreak — different timezones produce different outcomes", () => {

  it("same UTC timestamps: IST user increments, UTC user does not", () => {
    // 18:40 UTC May 18 = May 19 00:10 IST
    // But for UTC user it's still May 18
    const lastLogin    = "2026-05-18T18:20:00Z"; // 20 min earlier
    const currentLogin = "2026-05-18T18:40:00Z";

    const istResult = calculateStreak(lastLogin, currentLogin, "Asia/Kolkata", 5);
    const utcResult = calculateStreak(lastLogin, currentLogin, "UTC",          5);

    expect(istResult.action).toBe("increment");  // crossed IST midnight
    expect(utcResult.action).toBe("unchanged");  // same UTC calendar day
  });
});

// ─── Clock skew / replay protection ──────────────────────────────────────────

describe("calculateStreak — clock skew / replay", () => {
  it("treats negative daysDiff (current < last) as unchanged", () => {
    const last    = "2026-05-19T10:00:00Z";
    const current = "2026-05-18T10:00:00Z"; // earlier than last
    const result  = calculateStreak(last, current, "Asia/Kolkata", 3);
    expect(result.action).toBe("unchanged");
    expect(result.newStreak).toBe(3);
  });
});

// ─── Badge threshold helpers ──────────────────────────────────────────────────

describe("meetsGreenStreakThreshold", () => {
  it("returns false for streak 6", () => expect(meetsGreenStreakThreshold(6)).toBe(false));
  it("returns true  for streak 7", () => expect(meetsGreenStreakThreshold(7)).toBe(true));
  it("returns true  for streak 30", () => expect(meetsGreenStreakThreshold(30)).toBe(true));
  it("returns false for streak 0", () => expect(meetsGreenStreakThreshold(0)).toBe(false));
});

describe("streakMilestoneCrossed", () => {
  it("returns 7 when crossing from 6 to 7", () => {
    expect(streakMilestoneCrossed(6, 7)).toBe(7);
  });
  it("returns 14 when crossing from 13 to 14", () => {
    expect(streakMilestoneCrossed(13, 14)).toBe(14);
  });
  it("returns 30 when crossing from 29 to 30", () => {
    expect(streakMilestoneCrossed(29, 30)).toBe(30);
  });
  it("returns null when no milestone is crossed", () => {
    expect(streakMilestoneCrossed(5, 6)).toBeNull();
    expect(streakMilestoneCrossed(7, 8)).toBeNull();
  });
  it("returns the first milestone crossed if multiple are skipped (reset case)", () => {
    // If user resets and somehow jumps (shouldn't happen but defensive)
    expect(streakMilestoneCrossed(0, 7)).toBe(7);
  });
});

// ─── computeStreakUpdate ──────────────────────────────────────────────────────

describe("computeStreakUpdate", () => {
  it("returns correct mutation payload for an increment", () => {
    const profile = {
      current_streak:  4,
      last_login_at:   "2026-05-17T10:00:00Z",
      user_timezone:   "Asia/Kolkata",
    };
    const now = "2026-05-18T10:00:00Z";
    const result = computeStreakUpdate(profile, now);

    expect(result.current_streak).toBe(5);
    expect(result.last_login_at).toBe(now);
    expect(result.streak_action).toBe("increment");
  });

  it("returns streak_action=unchanged when same IST day", () => {
    const profile = {
      current_streak: 3,
      last_login_at:  "2026-05-18T04:00:00Z", // 09:30 IST
      user_timezone:  "Asia/Kolkata",
    };
    const result = computeStreakUpdate(profile, "2026-05-18T12:00:00Z"); // 17:30 IST

    expect(result.current_streak).toBe(3);
    expect(result.streak_action).toBe("unchanged");
  });

  it("defaults timezone to Asia/Kolkata when not set in profile", () => {
    const profile = { current_streak: 1, last_login_at: "2026-05-17T10:00:00Z" };
    const result  = computeStreakUpdate(profile, "2026-05-18T10:00:00Z");
    expect(result.current_streak).toBe(2);
  });
});
