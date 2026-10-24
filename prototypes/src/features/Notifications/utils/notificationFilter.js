/**
 * src/features/Notifications/utils/notificationFilter.js
 *
 * Pure gate function: given a notification payload and a user's preferences,
 * returns whether the notification should be delivered.
 *
 * Called by:
 *   - Edge Functions before sending FCM (server-side gate)
 *   - The in-app notification handler before showing a foreground alert
 *
 * Deliberately a pure function with no side-effects — easy to test.
 */

import {
  NOTIFICATION_TYPE,
  TYPE_TO_PREFERENCE_KEY,
  DEFAULT_PREFERENCES,
} from "../constants/notificationTypes";

/**
 * @typedef {{
 *   type:    string,
 *   userId?: string,
 *   data?:   Record<string, unknown>,
 * }} NotificationPayload
 *
 * @typedef {{
 *   shouldSend: boolean,
 *   reason:     string,
 * }} FilterResult
 */

/**
 * Returns whether a notification should be sent / displayed.
 *
 * Rules (evaluated in order):
 *   1. SYSTEM type → always send (cannot be silenced)
 *   2. all_disabled = true → never send
 *   3. Type-specific preference key → check its boolean value
 *   4. Unknown type → default to send (forward-compatible)
 *
 * @param {NotificationPayload}    notification
 * @param {Partial<import("../constants/notificationTypes").NotificationPreferences>} preferences
 * @returns {FilterResult}
 */
export function shouldSendNotification(notification, preferences = {}) {
  // Merge with defaults so missing keys don't block delivery
  const prefs = { ...DEFAULT_PREFERENCES, ...preferences };

  // Rule 1: system notifications always go through
  if (notification.type === NOTIFICATION_TYPE.SYSTEM) {
    return { shouldSend: true, reason: "system_always_send" };
  }

  // Rule 2: master kill-switch
  if (prefs.all_disabled) {
    return { shouldSend: false, reason: "all_notifications_disabled" };
  }

  // Rule 3: per-type preference key
  const prefKey = TYPE_TO_PREFERENCE_KEY[notification.type];
  if (prefKey !== undefined) {
    const enabled = Boolean(prefs[prefKey]);
    return {
      shouldSend: enabled,
      reason:     enabled ? `preference_${prefKey}_enabled` : `preference_${prefKey}_disabled`,
    };
  }

  // Rule 4: unknown type → send (new types added later won't be silently dropped)
  return { shouldSend: true, reason: "unknown_type_default_send" };
}

/**
 * Filters a batch of notifications down to only those that should be sent.
 *
 * @param {NotificationPayload[]} notifications
 * @param {Partial<import("../constants/notificationTypes").NotificationPreferences>} preferences
 * @returns {{ notification: NotificationPayload, result: FilterResult }[]}
 */
export function filterNotificationBatch(notifications, preferences = {}) {
  return notifications.map((notification) => ({
    notification,
    result: shouldSendNotification(notification, preferences),
  }));
}
