/**
 * src/features/RateApp/utils/rateAppAnalytics.js
 *
 * PostHog event tracking for the Rate App flow.
 *
 * Events sent:
 *   rate_prompt_shown       — prompt was displayed
 *   rate_prompt_responded   — user made a choice (rated/feedback/dismissed)
 *   rate_feedback_submitted — user completed the fallback feedback form
 *
 * All events include standard properties (app version, open count, platform)
 * so you can slice them in PostHog by version cohort.
 *
 * PostHog client: assumes a global `posthog` instance is initialised in
 * your app entry point via posthog-react-native.
 * Import path is aliased — adjust to your actual PostHog setup.
 */

import { Platform } from "react-native";
import { POSTHOG_EVENTS } from "../constants/rateAppConfig";

// ─── PostHog client ───────────────────────────────────────────────────────────
// Adjust this import to match your PostHog initialisation file.
// Common patterns:
//   import posthog from "@/lib/posthog";
//   import { usePostHog } from "posthog-react-native";  ← hook version

let _posthog = null;

/**
 * Inject the PostHog client. Call once at app startup.
 * This avoids circular imports and works with both class and hook patterns.
 *
 * @param {object} posthogClient
 */
export function initRateAppAnalytics(posthogClient) {
  _posthog = posthogClient;
}

/**
 * Internal safe capture — swallows errors so analytics never crashes the app.
 * @param {string}              event
 * @param {Record<string, any>} properties
 */
function capture(event, properties) {
  try {
    if (!_posthog) {
      if (__DEV__) console.log(`[RateApp Analytics] ${event}`, properties);
      return;
    }
    _posthog.capture(event, properties);
  } catch (err) {
    console.warn("[RateApp] Analytics capture error:", err);
  }
}

// ─── Shared context builder ───────────────────────────────────────────────────

/**
 * Returns properties common to every rate app event.
 * @param {{ appVersion: string, openCount: number }} ctx
 */
function baseProps({ appVersion, openCount }) {
  return {
    app_version:   appVersion,
    major_version: appVersion.split(".")[0] ?? "0",
    open_count:    openCount,
    platform:      Platform.OS,       // "ios" | "android"
  };
}

// ─── Event senders ────────────────────────────────────────────────────────────

/**
 * Track: Rate prompt was shown to the user.
 *
 * @param {{ appVersion: string, openCount: number }} ctx
 */
export function trackPromptShown({ appVersion, openCount }) {
  capture(POSTHOG_EVENTS.PROMPT_SHOWN, {
    ...baseProps({ appVersion, openCount }),
    trigger: "app_open_count",   // future: could be "milestone", "post_purchase", etc.
  });
}

/**
 * Track: User responded to the rate prompt.
 *
 * @param {{
 *   appVersion: string,
 *   openCount:  number,
 *   action:     "rated" | "declined_feedback" | "declined_dismissed",
 * }} params
 */
export function trackPromptResponded({ appVersion, openCount, action }) {
  capture(POSTHOG_EVENTS.PROMPT_RESPONDED, {
    ...baseProps({ appVersion, openCount }),
    action,
  });
}

/**
 * Track: User submitted the fallback feedback form.
 *
 * @param {{
 *   appVersion:  string,
 *   openCount:   number,
 *   starRating:  number,       1–5
 *   categories:  string[],     selected category ids
 *   hasMessage:  boolean,      true if user typed a message
 * }} params
 */
export function trackFeedbackSubmitted({ appVersion, openCount, starRating, categories, hasMessage }) {
  capture(POSTHOG_EVENTS.FEEDBACK_SUBMITTED, {
    ...baseProps({ appVersion, openCount }),
    star_rating:  starRating,
    categories,
    has_message:  hasMessage,
    // NOTE: we do NOT send the message text to PostHog — it may contain PII.
    // Message is sent to your support backend separately.
  });
}
