/**
 * src/features/Notifications/utils/deepLinkRouter.js
 *
 * Maps incoming notification payloads to app screen routes.
 *
 * Used in two contexts:
 *   1. Notification background tap handler (app was killed / backgrounded)
 *   2. Foreground notification handler (app is active)
 *
 * All routes use the React Navigation route name convention.
 * Deep link URL scheme: kisansathi://
 */

import { NOTIFICATION_TYPE } from "../constants/notificationTypes";

/**
 * @typedef {{
 *   screen:  string,             // React Navigation route name
 *   params?: Record<string, unknown>,
 * }} DeepLinkDestination
 */

/**
 * Returns the screen + params to navigate to for a given notification.
 *
 * @param {{
 *   type:  string,
 *   data?: Record<string, unknown>,
 * }} notification
 * @returns {DeepLinkDestination}
 */
export function getDeepLinkDestination(notification) {
  const { type, data = {} } = notification;

  switch (type) {
    case NOTIFICATION_TYPE.PRICE_ALERT:
      return {
        screen: "Market",
        params: {
          ...(data.crop      && { crop:      data.crop      }),
          ...(data.crop_id   && { cropId:    data.crop_id   }),
          ...(data.mandi_id  && { mandiId:   data.mandi_id  }),
        },
      };

    case NOTIFICATION_TYPE.BADGE_EARNED:
      return {
        screen: "Profile",
        params: {
          scrollTo:   "badges",
          ...(data.badge_id && { highlightBadgeId: data.badge_id }),
        },
      };

    case NOTIFICATION_TYPE.COMMUNITY_REPLY:
      return {
        screen: "CommunityPost",
        params: {
          postId:  data.post_id,
          replyId: data.reply_id ?? null,
        },
      };

    case NOTIFICATION_TYPE.LEADERBOARD_CHANGE:
      return {
        screen: "Leaderboard",
        params: {
          tab: data.period ?? "weekly",
        },
      };

    case NOTIFICATION_TYPE.WEEKLY_SUMMARY:
      return {
        screen: "Leaderboard",
        params: { tab: "weekly" },
      };

    case NOTIFICATION_TYPE.STREAK_REMINDER:
      return {
        screen: "Home",
        params: { highlight: "streak" },
      };

    case NOTIFICATION_TYPE.RATE_APP:
      return { screen: "Home", params: {} };

    case NOTIFICATION_TYPE.SYSTEM:
      return { screen: "Home", params: {} };

    default:
      // Unknown type — safe fallback
      return { screen: "Home", params: {} };
  }
}

/**
 * Converts a kisansathi:// deep link URL to a screen destination.
 * Supports both URL-scheme and HTTPS universal links.
 *
 * Examples:
 *   kisansathi://market/wheat?mandi_id=123   → { screen: "Market", params: { crop: "wheat", mandiId: "123" } }
 *   kisansathi://profile/badges/badge-xyz    → { screen: "Profile", params: { scrollTo: "badges", highlightBadgeId: "badge-xyz" } }
 *
 * @param {string} url
 * @returns {DeepLinkDestination}
 */
export function parseDeepLinkUrl(url) {
  try {
    // Normalise to standard URL for parsing
    const normalised = url
      .replace(/^kisansathi:\/\//, "https://kisansathi.in/")
      .replace(/^https:\/\/kisansathi\.in/, "https://kisansathi.in");

    const parsed = new URL(normalised);
    const segments = parsed.pathname.replace(/^\//, "").split("/").filter(Boolean);
    const searchParams = Object.fromEntries(parsed.searchParams.entries());

    const [root, ...rest] = segments;

    switch (root) {
      case "market":
        return {
          screen: "Market",
          params: {
            ...(rest[0]              && { crop:    rest[0] }),
            ...(searchParams.mandi_id && { mandiId: searchParams.mandi_id }),
          },
        };
      case "profile":
        return {
          screen: "Profile",
          params: {
            scrollTo:          rest[0] ?? undefined,
            highlightBadgeId:  rest[1] ?? undefined,
          },
        };
      case "community":
        return {
          screen: "CommunityPost",
          params: { postId: rest[0], replyId: rest[1] ?? null },
        };
      case "leaderboard":
        return {
          screen: "Leaderboard",
          params: { tab: searchParams.tab ?? "weekly" },
        };
      default:
        return { screen: "Home", params: {} };
    }
  } catch {
    return { screen: "Home", params: {} };
  }
}
