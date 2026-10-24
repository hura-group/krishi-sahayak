/**
 * src/features/RateApp/constants/rateAppConfig.js
 *
 * Single source of truth for all Rate App Flow thresholds,
 * storage keys, PostHog event names, and timing values.
 *
 * Edit these constants to tune the flow without touching logic code.
 */

// ─── Trigger conditions ───────────────────────────────────────────────────────

export const RATE_APP_CONFIG = {
  /** Show prompt after this many app opens (counts unique sessions) */
  OPENS_REQUIRED:   7,

  /**
   * Days before showing the prompt again after a "Later" / dismiss.
   * After a full response (rated OR feedback submitted), never show again
   * for the same major version.
   */
  COOLDOWN_DAYS:    90,

  /**
   * Milliseconds after app foreground before the prompt appears.
   * Gives the user time to orient before interrupting.
   */
  SHOW_DELAY_MS:    2_500,

  /**
   * Show at most once per major version (semver X.y.z → X).
   * e.g. showing for "2.x.x" will not re-show for "2.4.1" after "2.0.0" prompted.
   * Resets on major bump (3.0.0 will prompt again).
   */
  ONCE_PER_MAJOR_VERSION: true,
};

// ─── AsyncStorage keys ────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  /** Integer — total lifetime app opens (incremented on each foreground) */
  OPEN_COUNT:       "kisan_rate_open_count",

  /** ISO string — when the prompt was last shown to the user */
  LAST_SHOWN_AT:    "kisan_rate_last_shown_at",

  /** JSON array of major version strings that have already been prompted */
  SHOWN_VERSIONS:   "kisan_rate_shown_versions",

  /** ISO string — earliest datetime the next prompt is eligible to show */
  NEXT_ELIGIBLE_AT: "kisan_rate_next_eligible_at",

  /** Boolean string — user tapped "Rate" and we launched store review */
  USER_RATED:       "kisan_rate_user_rated",

  /** Boolean string — user submitted the fallback feedback form */
  FEEDBACK_GIVEN:   "kisan_rate_feedback_given",
};

// ─── PostHog event names ──────────────────────────────────────────────────────

export const POSTHOG_EVENTS = {
  /** Native/custom prompt was displayed to the user */
  PROMPT_SHOWN:       "rate_prompt_shown",

  /** User made a choice on the prompt */
  PROMPT_RESPONDED:   "rate_prompt_responded",

  /** User submitted the feedback fallback form */
  FEEDBACK_SUBMITTED: "rate_feedback_submitted",
};

/**
 * @typedef {"rated" | "declined_feedback" | "declined_dismissed" | "feedback_submitted"} RateAction
 *
 * - rated               → tapped "Rate Now"; native store review launched
 * - declined_feedback   → tapped "Give Feedback"; opened fallback form
 * - declined_dismissed  → tapped "Later" or dismissed the sheet
 * - feedback_submitted  → submitted the fallback form
 */

// ─── Feedback form options ────────────────────────────────────────────────────

export const FEEDBACK_CATEGORIES = [
  { id: "ux",          label: "Easy to use" },
  { id: "prices",      label: "Market prices" },
  { id: "scanning",    label: "Crop scanning" },
  { id: "community",   label: "Community" },
  { id: "performance", label: "App speed" },
  { id: "other",       label: "Other" },
];

export const STAR_COUNT = 5;
