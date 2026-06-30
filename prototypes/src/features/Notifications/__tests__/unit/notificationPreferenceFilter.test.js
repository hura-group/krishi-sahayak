/**
 * __tests__/unit/notificationPreferenceFilter.test.js
 *
 * Unit tests for shouldSendNotification() and filterNotificationBatch().
 * Zero network calls — purely functional.
 *
 * Covers:
 *   ✓ All types pass when all preferences are enabled (default)
 *   ✓ price_alert blocked when price_alerts preference = false
 *   ✓ badge_earned blocked when badges preference = false
 *   ✓ community_reply blocked when community preference = false
 *   ✓ leaderboard_change blocked when leaderboard preference = false
 *   ✓ weekly_summary blocked when weekly_summary preference = false
 *   ✓ streak_reminder blocked when streak_reminders preference = false
 *   ✓ all_disabled = true blocks every non-system type
 *   ✓ SYSTEM type always passes — even when all_disabled = true
 *   ✓ Unknown type defaults to send (forward-compatible)
 *   ✓ Missing preference key defaults to enabled (no silent drops)
 *   ✓ Reason strings are descriptive and deterministic
 *   ✓ filterNotificationBatch returns correct per-item results
 *   ✓ Empty preferences object falls back to all-enabled defaults
 */

import { describe, it, expect } from "vitest";
import {
  shouldSendNotification,
  filterNotificationBatch,
} from "../../utils/notificationFilter";
import { NOTIFICATION_TYPE } from "../../constants/notificationTypes";
import {
  makeNotification,
  makePriceAlertNotification,
  makeSystemNotification,
  makePreferences,
} from "../helpers/mockHelpers";

// ─── Happy path — all enabled ─────────────────────────────────────────────────

describe("shouldSendNotification — all preferences enabled (defaults)", () => {
  const prefs = makePreferences(); // all true

  it.each([
    NOTIFICATION_TYPE.PRICE_ALERT,
    NOTIFICATION_TYPE.BADGE_EARNED,
    NOTIFICATION_TYPE.COMMUNITY_REPLY,
    NOTIFICATION_TYPE.LEADERBOARD_CHANGE,
    NOTIFICATION_TYPE.WEEKLY_SUMMARY,
    NOTIFICATION_TYPE.STREAK_REMINDER,
    NOTIFICATION_TYPE.SYSTEM,
  ])("sends %s when all preferences are enabled", (type) => {
    const result = shouldSendNotification(makeNotification({ type }), prefs);
    expect(result.shouldSend).toBe(true);
  });
});

// ─── Per-type disable ─────────────────────────────────────────────────────────

describe("shouldSendNotification — individual type disabled", () => {

  it("blocks price_alert when price_alerts = false", () => {
    const prefs  = makePreferences({ price_alerts: false });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }, prefs);
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("preference_price_alerts_disabled");
  });

  it("blocks badge_earned when badges = false", () => {
    const prefs  = makePreferences({ badges: false });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.BADGE_EARNED }, prefs);
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("preference_badges_disabled");
  });

  it("blocks community_reply when community = false", () => {
    const prefs  = makePreferences({ community: false });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.COMMUNITY_REPLY }, prefs);
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("preference_community_disabled");
  });

  it("blocks leaderboard_change when leaderboard = false", () => {
    const prefs  = makePreferences({ leaderboard: false });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.LEADERBOARD_CHANGE }, prefs);
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("preference_leaderboard_disabled");
  });

  it("blocks weekly_summary when weekly_summary = false", () => {
    const prefs  = makePreferences({ weekly_summary: false });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.WEEKLY_SUMMARY }, prefs);
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("preference_weekly_summary_disabled");
  });

  it("blocks streak_reminder when streak_reminders = false", () => {
    const prefs  = makePreferences({ streak_reminders: false });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.STREAK_REMINDER }, prefs);
    expect(result.shouldSend).toBe(false);
    expect(result.reason).toBe("preference_streak_reminders_disabled");
  });

  it("disabling one type does not affect other types", () => {
    const prefs       = makePreferences({ price_alerts: false });
    const badgeResult = shouldSendNotification({ type: NOTIFICATION_TYPE.BADGE_EARNED }, prefs);
    const comResult   = shouldSendNotification({ type: NOTIFICATION_TYPE.COMMUNITY_REPLY }, prefs);
    expect(badgeResult.shouldSend).toBe(true);
    expect(comResult.shouldSend).toBe(true);
  });

  it("still sends if preference value is 1 (truthy non-boolean)", () => {
    const prefs  = makePreferences({ price_alerts: 1 as unknown as boolean });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }, prefs);
    expect(result.shouldSend).toBe(true);
  });

  it("blocks if preference value is 0 (falsy non-boolean)", () => {
    const prefs  = makePreferences({ price_alerts: 0 as unknown as boolean });
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }, prefs);
    expect(result.shouldSend).toBe(false);
  });
});

// ─── Master kill-switch ───────────────────────────────────────────────────────

describe("shouldSendNotification — all_disabled master switch", () => {

  it("blocks every non-system type when all_disabled = true", () => {
    const prefs = makePreferences({ all_disabled: true });
    const types = [
      NOTIFICATION_TYPE.PRICE_ALERT,
      NOTIFICATION_TYPE.BADGE_EARNED,
      NOTIFICATION_TYPE.COMMUNITY_REPLY,
      NOTIFICATION_TYPE.LEADERBOARD_CHANGE,
      NOTIFICATION_TYPE.WEEKLY_SUMMARY,
      NOTIFICATION_TYPE.STREAK_REMINDER,
    ];
    types.forEach((type) => {
      const result = shouldSendNotification({ type }, prefs);
      expect(result.shouldSend, `expected ${type} to be blocked`).toBe(false);
      expect(result.reason).toBe("all_notifications_disabled");
    });
  });

  it("SYSTEM type bypasses all_disabled = true", () => {
    const prefs  = makePreferences({ all_disabled: true });
    const result = shouldSendNotification(makeSystemNotification(), prefs);
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("system_always_send");
  });

  it("SYSTEM type bypasses all individual preferences disabled", () => {
    const prefs = makePreferences({
      all_disabled:    false,
      price_alerts:    false,
      badges:          false,
      community:       false,
      leaderboard:     false,
      weekly_summary:  false,
      streak_reminders:false,
    });
    const result = shouldSendNotification(makeSystemNotification(), prefs);
    expect(result.shouldSend).toBe(true);
  });
});

// ─── Unknown / future notification types ─────────────────────────────────────

describe("shouldSendNotification — unknown types", () => {

  it("sends an unknown type by default (forward-compatible)", () => {
    const result = shouldSendNotification({ type: "new_feature_v4_type" }, makePreferences());
    expect(result.shouldSend).toBe(true);
    expect(result.reason).toBe("unknown_type_default_send");
  });

  it("unknown type is still blocked by all_disabled = true", () => {
    const prefs  = makePreferences({ all_disabled: true });
    const result = shouldSendNotification({ type: "new_future_type" }, prefs);
    expect(result.shouldSend).toBe(false);
  });
});

// ─── Empty / missing preferences ─────────────────────────────────────────────

describe("shouldSendNotification — missing / partial preferences", () => {

  it("defaults to enabled when preferences object is empty {}", () => {
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }, {});
    expect(result.shouldSend).toBe(true);
  });

  it("defaults to enabled when preferences is undefined", () => {
    const result = shouldSendNotification({ type: NOTIFICATION_TYPE.BADGE_EARNED });
    expect(result.shouldSend).toBe(true);
  });

  it("uses provided value when a specific key is present, defaults the rest", () => {
    // Only price_alerts is provided and set to false — badges should still default to true
    const prefs  = { price_alerts: false };
    const badge  = shouldSendNotification({ type: NOTIFICATION_TYPE.BADGE_EARNED }, prefs);
    const price  = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT  }, prefs);
    expect(badge.shouldSend).toBe(true);
    expect(price.shouldSend).toBe(false);
  });
});

// ─── Reason strings ───────────────────────────────────────────────────────────

describe("shouldSendNotification — reason strings", () => {

  it("reason is 'system_always_send' for SYSTEM type", () => {
    const { reason } = shouldSendNotification({ type: NOTIFICATION_TYPE.SYSTEM }, makePreferences());
    expect(reason).toBe("system_always_send");
  });

  it("reason includes 'enabled' suffix when preference is on", () => {
    const { reason } = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }, makePreferences());
    expect(reason).toContain("enabled");
  });

  it("reason includes 'disabled' suffix when preference is off", () => {
    const prefs  = makePreferences({ price_alerts: false });
    const { reason } = shouldSendNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }, prefs);
    expect(reason).toContain("disabled");
  });

  it("reason includes the preference key name for traceability", () => {
    const prefs  = makePreferences({ community: false });
    const { reason } = shouldSendNotification({ type: NOTIFICATION_TYPE.COMMUNITY_REPLY }, prefs);
    expect(reason).toContain("community");
  });
});

// ─── Batch filter ─────────────────────────────────────────────────────────────

describe("filterNotificationBatch", () => {

  it("returns a result for every input notification", () => {
    const prefs = makePreferences();
    const batch = [
      makeNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }),
      makeNotification({ type: NOTIFICATION_TYPE.BADGE_EARNED }),
      makeNotification({ type: NOTIFICATION_TYPE.COMMUNITY_REPLY }),
    ];
    const results = filterNotificationBatch(batch, prefs);
    expect(results).toHaveLength(3);
  });

  it("correctly splits enabled vs disabled in a mixed batch", () => {
    const prefs = makePreferences({ price_alerts: false });
    const batch = [
      makeNotification({ type: NOTIFICATION_TYPE.PRICE_ALERT }),
      makeNotification({ type: NOTIFICATION_TYPE.BADGE_EARNED }),
      makeSystemNotification(),
    ];
    const results = filterNotificationBatch(batch, prefs);

    const shouldSendList = results.map((r) => r.result.shouldSend);
    expect(shouldSendList).toEqual([false, true, true]);
  });

  it("preserves the original notification object alongside the result", () => {
    const notification = makePriceAlertNotification();
    const results      = filterNotificationBatch([notification], makePreferences());
    expect(results[0].notification).toBe(notification);
  });

  it("handles an empty batch gracefully", () => {
    expect(filterNotificationBatch([], makePreferences())).toEqual([]);
  });
});
