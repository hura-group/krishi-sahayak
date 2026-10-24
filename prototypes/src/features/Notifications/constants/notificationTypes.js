/**
 * src/features/Notifications/constants/notificationTypes.js
 *
 * Single source of truth for every notification type in the system,
 * the preference key it maps to, and whether it can be silenced.
 */

/** Every notification type the app can send */
export const NOTIFICATION_TYPE = {
  PRICE_ALERT:        "price_alert",
  BADGE_EARNED:       "badge_earned",
  COMMUNITY_REPLY:    "community_reply",
  LEADERBOARD_CHANGE: "leaderboard_change",
  WEEKLY_SUMMARY:     "weekly_summary",
  STREAK_REMINDER:    "streak_reminder",
  RATE_APP:           "rate_app",
  SYSTEM:             "system",   // critical — cannot be silenced
};

/**
 * Maps each notification type to the user-preference key that controls it.
 * If a type is NOT in this map it defaults to enabled.
 */
export const TYPE_TO_PREFERENCE_KEY = {
  [NOTIFICATION_TYPE.PRICE_ALERT]:        "price_alerts",
  [NOTIFICATION_TYPE.BADGE_EARNED]:       "badges",
  [NOTIFICATION_TYPE.COMMUNITY_REPLY]:    "community",
  [NOTIFICATION_TYPE.LEADERBOARD_CHANGE]: "leaderboard",
  [NOTIFICATION_TYPE.WEEKLY_SUMMARY]:     "weekly_summary",
  [NOTIFICATION_TYPE.STREAK_REMINDER]:    "streak_reminders",
  [NOTIFICATION_TYPE.RATE_APP]:           "rate_app",
};

/**
 * Default preferences object — all categories enabled, quiet hours off.
 * Matches the shape stored in the user_notification_preferences table.
 *
 * @typedef {{
 *   all_disabled:     boolean,
 *   price_alerts:     boolean,
 *   badges:           boolean,
 *   community:        boolean,
 *   leaderboard:      boolean,
 *   weekly_summary:   boolean,
 *   streak_reminders: boolean,
 *   rate_app:         boolean,
 *   quiet_hours_enabled: boolean,
 *   quiet_start:      string,   // "HH:MM" in user's timezone
 *   quiet_end:        string,   // "HH:MM" in user's timezone
 *   timezone:         string,   // IANA, default "Asia/Kolkata"
 * }} NotificationPreferences
 */
export const DEFAULT_PREFERENCES = {
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
};
