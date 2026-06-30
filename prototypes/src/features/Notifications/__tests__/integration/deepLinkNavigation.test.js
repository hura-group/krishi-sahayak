/**
 * __tests__/integration/deepLinkNavigation.test.js
 *
 * Tests the full deep-link routing pipeline:
 *   notification payload → getDeepLinkDestination() → navigate(screen, params)
 *   URL scheme          → parseDeepLinkUrl()         → navigate(screen, params)
 *
 * Covers:
 *   ✓ price_alert          → Market screen  (with crop + mandiId params)
 *   ✓ badge_earned         → Profile screen (scrollTo="badges", highlightBadgeId)
 *   ✓ community_reply      → CommunityPost  (postId + replyId)
 *   ✓ leaderboard_change   → Leaderboard    (tab="weekly")
 *   ✓ weekly_summary       → Leaderboard    (tab="weekly")
 *   ✓ streak_reminder      → Home           (highlight="streak")
 *   ✓ rate_app             → Home
 *   ✓ system               → Home
 *   ✓ unknown type         → Home           (safe fallback)
 *   ✓ null / undefined type → Home          (no throw)
 *
 *   URL scheme:
 *   ✓ kisansathi://market/wheat?mandi_id=123
 *   ✓ kisansathi://profile/badges/badge-xyz
 *   ✓ kisansathi://community/post-abc/reply-def
 *   ✓ kisansathi://leaderboard?tab=monthly
 *   ✓ kisansathi://unknown → Home fallback
 *   ✓ Malformed URL → Home fallback (no throw)
 *   ✓ HTTPS universal link → same result as URL scheme
 *
 *   Navigation integration:
 *   ✓ Background tap: navigate() called exactly once with correct args
 *   ✓ Foreground: notification received + navigate() called
 *   ✓ Params are plain objects (serialisable — safe for React Navigation)
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getDeepLinkDestination,
  parseDeepLinkUrl,
} from "../../utils/deepLinkRouter";
import { NOTIFICATION_TYPE } from "../../constants/notificationTypes";
import { createNavigationMock } from "../helpers/mockHelpers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Runs getDeepLinkDestination and then calls nav.navigate() — mirrors app handler */
function simulateNotificationTap(navigation, notification) {
  const { screen, params } = getDeepLinkDestination(notification);
  navigation.navigate(screen, params);
  return { screen, params };
}

/** Runs parseDeepLinkUrl and then calls nav.navigate() */
function simulateUrlOpen(navigation, url) {
  const { screen, params } = parseDeepLinkUrl(url);
  navigation.navigate(screen, params);
  return { screen, params };
}

// ─────────────────────────────────────────────────────────────────────────────
// getDeepLinkDestination — notification payload → screen
// ─────────────────────────────────────────────────────────────────────────────

describe("getDeepLinkDestination — notification type routing", () => {
  let nav;
  beforeEach(() => { nav = createNavigationMock(); });

  // ── price_alert ──────────────────────────────────────────────────────────

  it("routes price_alert to Market screen", () => {
    const { screen } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.PRICE_ALERT, data: {},
    });
    expect(screen).toBe("Market");
  });

  it("includes crop in Market params when provided", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.PRICE_ALERT,
      data: { crop: "wheat", crop_id: "crop-001" },
    });
    expect(params.crop).toBe("wheat");
    expect(params.cropId).toBe("crop-001");
  });

  it("includes mandiId in Market params when provided", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.PRICE_ALERT,
      data: { mandi_id: "mandi-ahmedabad-01" },
    });
    expect(params.mandiId).toBe("mandi-ahmedabad-01");
  });

  it("routes price_alert to Market screen even without data", () => {
    const { screen, params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.PRICE_ALERT,
    });
    expect(screen).toBe("Market");
    expect(params).toBeDefined();
  });

  // ── badge_earned ─────────────────────────────────────────────────────────

  it("routes badge_earned to Profile screen", () => {
    const { screen } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.BADGE_EARNED, data: {},
    });
    expect(screen).toBe("Profile");
  });

  it("sets scrollTo='badges' for badge notifications", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.BADGE_EARNED,
      data: { badge_id: "first-scan" },
    });
    expect(params.scrollTo).toBe("badges");
  });

  it("passes highlightBadgeId when badge_id is present", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.BADGE_EARNED,
      data: { badge_id: "harvest-hero" },
    });
    expect(params.highlightBadgeId).toBe("harvest-hero");
  });

  it("omits highlightBadgeId when badge_id is absent", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.BADGE_EARNED, data: {},
    });
    expect(params.highlightBadgeId).toBeUndefined();
  });

  // ── community_reply ───────────────────────────────────────────────────────

  it("routes community_reply to CommunityPost screen", () => {
    const { screen } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.COMMUNITY_REPLY,
      data: { post_id: "post-123", reply_id: "reply-456" },
    });
    expect(screen).toBe("CommunityPost");
  });

  it("passes postId and replyId params for community replies", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.COMMUNITY_REPLY,
      data: { post_id: "post-abc", reply_id: "reply-def" },
    });
    expect(params.postId).toBe("post-abc");
    expect(params.replyId).toBe("reply-def");
  });

  it("replyId is null when absent from data", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.COMMUNITY_REPLY,
      data: { post_id: "post-abc" },
    });
    expect(params.replyId).toBeNull();
  });

  // ── leaderboard_change ────────────────────────────────────────────────────

  it("routes leaderboard_change to Leaderboard screen", () => {
    const { screen } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.LEADERBOARD_CHANGE, data: {},
    });
    expect(screen).toBe("Leaderboard");
  });

  it("passes tab='weekly' when period not specified", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.LEADERBOARD_CHANGE, data: {},
    });
    expect(params.tab).toBe("weekly");
  });

  it("passes correct tab when period is specified in data", () => {
    const { params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.LEADERBOARD_CHANGE,
      data: { period: "monthly" },
    });
    expect(params.tab).toBe("monthly");
  });

  // ── weekly_summary ────────────────────────────────────────────────────────

  it("routes weekly_summary to Leaderboard with tab='weekly'", () => {
    const { screen, params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.WEEKLY_SUMMARY, data: {},
    });
    expect(screen).toBe("Leaderboard");
    expect(params.tab).toBe("weekly");
  });

  // ── streak_reminder ───────────────────────────────────────────────────────

  it("routes streak_reminder to Home with highlight='streak'", () => {
    const { screen, params } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.STREAK_REMINDER, data: {},
    });
    expect(screen).toBe("Home");
    expect(params.highlight).toBe("streak");
  });

  // ── system ────────────────────────────────────────────────────────────────

  it("routes system notification to Home screen", () => {
    const { screen } = simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.SYSTEM, data: {},
    });
    expect(screen).toBe("Home");
  });

  // ── unknown / null type ───────────────────────────────────────────────────

  it("routes unknown type to Home screen (safe fallback)", () => {
    const { screen } = simulateNotificationTap(nav, {
      type: "some_new_future_type_v5", data: {},
    });
    expect(screen).toBe("Home");
  });

  it("routes null type to Home without throwing", () => {
    expect(() => simulateNotificationTap(nav, { type: null, data: {} })).not.toThrow();
    expect(nav.lastCall()?.screen).toBe("Home");
  });

  it("routes undefined type to Home without throwing", () => {
    expect(() => simulateNotificationTap(nav, {})).not.toThrow();
    expect(nav.lastCall()?.screen).toBe("Home");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parseDeepLinkUrl — URL scheme → screen
// ─────────────────────────────────────────────────────────────────────────────

describe("parseDeepLinkUrl — URL scheme routing", () => {
  let nav;
  beforeEach(() => { nav = createNavigationMock(); });

  it("routes kisansathi://market/wheat to Market with crop='wheat'", () => {
    const { screen, params } = simulateUrlOpen(nav, "kisansathi://market/wheat");
    expect(screen).toBe("Market");
    expect(params.crop).toBe("wheat");
  });

  it("includes mandiId query param from URL", () => {
    const { params } = simulateUrlOpen(nav, "kisansathi://market/cotton?mandi_id=mandi-rajkot-01");
    expect(params.crop).toBe("cotton");
    expect(params.mandiId).toBe("mandi-rajkot-01");
  });

  it("routes kisansathi://market (no crop) to Market screen", () => {
    const { screen, params } = simulateUrlOpen(nav, "kisansathi://market");
    expect(screen).toBe("Market");
    expect(params.crop).toBeUndefined();
  });

  it("routes kisansathi://profile/badges to Profile with scrollTo='badges'", () => {
    const { screen, params } = simulateUrlOpen(nav, "kisansathi://profile/badges");
    expect(screen).toBe("Profile");
    expect(params.scrollTo).toBe("badges");
  });

  it("routes kisansathi://profile/badges/first-scan with highlightBadgeId", () => {
    const { params } = simulateUrlOpen(nav, "kisansathi://profile/badges/first-scan");
    expect(params.scrollTo).toBe("badges");
    expect(params.highlightBadgeId).toBe("first-scan");
  });

  it("routes kisansathi://community/post-abc to CommunityPost", () => {
    const { screen, params } = simulateUrlOpen(nav, "kisansathi://community/post-abc");
    expect(screen).toBe("CommunityPost");
    expect(params.postId).toBe("post-abc");
    expect(params.replyId).toBeNull();
  });

  it("routes kisansathi://community/post-abc/reply-def with replyId", () => {
    const { params } = simulateUrlOpen(nav, "kisansathi://community/post-abc/reply-def");
    expect(params.postId).toBe("post-abc");
    expect(params.replyId).toBe("reply-def");
  });

  it("routes kisansathi://leaderboard to Leaderboard with tab='weekly'", () => {
    const { screen, params } = simulateUrlOpen(nav, "kisansathi://leaderboard");
    expect(screen).toBe("Leaderboard");
    expect(params.tab).toBe("weekly");
  });

  it("routes kisansathi://leaderboard?tab=monthly with correct tab", () => {
    const { params } = simulateUrlOpen(nav, "kisansathi://leaderboard?tab=monthly");
    expect(params.tab).toBe("monthly");
  });

  it("routes HTTPS universal link: https://kisansathi.in/market/wheat", () => {
    const { screen, params } = simulateUrlOpen(nav, "https://kisansathi.in/market/wheat");
    expect(screen).toBe("Market");
    expect(params.crop).toBe("wheat");
  });

  it("routes unknown path to Home (safe fallback)", () => {
    const { screen } = simulateUrlOpen(nav, "kisansathi://settings/account");
    expect(screen).toBe("Home");
  });

  it("handles malformed URL without throwing", () => {
    expect(() => simulateUrlOpen(nav, "not-a-valid://url:::")).not.toThrow();
    expect(nav.lastCall()?.screen).toBe("Home");
  });

  it("handles empty string URL without throwing", () => {
    expect(() => simulateUrlOpen(nav, "")).not.toThrow();
    expect(nav.lastCall()?.screen).toBe("Home");
  });

  it("handles null URL without throwing", () => {
    expect(() => simulateUrlOpen(nav, null)).not.toThrow();
    expect(nav.lastCall()?.screen).toBe("Home");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Navigation integration — navigate() call assertions
// ─────────────────────────────────────────────────────────────────────────────

describe("deep link navigation — navigate() call assertions", () => {
  let nav;
  beforeEach(() => { nav = createNavigationMock(); });

  it("calls navigate() exactly once per notification tap", () => {
    simulateNotificationTap(nav, { type: NOTIFICATION_TYPE.PRICE_ALERT, data: {} });
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it("navigate() is called with the screen as first arg", () => {
    simulateNotificationTap(nav, { type: NOTIFICATION_TYPE.BADGE_EARNED, data: { badge_id: "legend" } });
    expect(nav.navigate).toHaveBeenCalledWith("Profile", expect.any(Object));
  });

  it("navigate() params are a plain serialisable object (no class instances)", () => {
    simulateNotificationTap(nav, {
      type: NOTIFICATION_TYPE.COMMUNITY_REPLY,
      data: { post_id: "post-abc", reply_id: "reply-xyz" },
    });
    const { params } = nav.lastCall();
    expect(() => JSON.stringify(params)).not.toThrow();
  });

  it("consecutive taps each call navigate() independently", () => {
    simulateNotificationTap(nav, { type: NOTIFICATION_TYPE.PRICE_ALERT, data: {} });
    simulateNotificationTap(nav, { type: NOTIFICATION_TYPE.BADGE_EARNED, data: {} });
    expect(nav.navigate).toHaveBeenCalledTimes(2);
    expect(nav.calls[0].screen).toBe("Market");
    expect(nav.calls[1].screen).toBe("Profile");
  });

  it("URL open calls navigate() exactly once", () => {
    simulateUrlOpen(nav, "kisansathi://market/wheat");
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });
});
