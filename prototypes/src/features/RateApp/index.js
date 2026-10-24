/**
 * src/features/RateApp/index.js
 *
 * Barrel export for the Rate App feature.
 *
 * ─── Minimal integration (2 lines in App.js) ─────────────────────────────────
 *
 *   import { useRateApp, useAppOpenTracker, RateAppPrompt } from "@/features/RateApp";
 *
 *   const rateApp = useRateApp();
 *   useAppOpenTracker({ onEligible: rateApp.maybeShow });
 *
 *   return (
 *     <>
 *       <NavigationContainer>...</NavigationContainer>
 *       <RateAppPrompt controller={rateApp} />
 *     </>
 *   );
 *
 * ─── Analytics init (once at app startup) ─────────────────────────────────────
 *
 *   import { initRateAppAnalytics } from "@/features/RateApp";
 *   import posthog from "@/lib/posthog";
 *   initRateAppAnalytics(posthog);
 *
 * ─── Dev / QA reset ──────────────────────────────────────────────────────────
 *
 *   import { __devResetRateAppStorage } from "@/features/RateApp";
 *   await __devResetRateAppStorage();  // clears all rate-app AsyncStorage
 */

// ── Components ────────────────────────────────────────────────────────────────
export { default as RateAppPrompt }     from "./components/RateAppPrompt";
export { default as FeedbackForm }      from "./components/FeedbackForm";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useRateApp, RATE_APP_STATE }   from "./hooks/useRateApp";
export {
  useAppOpenTracker,
  getAppVersion,
  getMajorVersion,
}                                       from "./hooks/useAppOpenTracker";

// ── Analytics ─────────────────────────────────────────────────────────────────
export {
  initRateAppAnalytics,
  trackPromptShown,
  trackPromptResponded,
  trackFeedbackSubmitted,
}                                       from "./utils/rateAppAnalytics";

// ── Storage (for advanced use / testing) ──────────────────────────────────────
export {
  incrementOpenCount,
  getOpenCount,
  checkEligibility,
  getNextEligibleDate,
  markUserRated,
  markFeedbackGiven,
  __devResetRateAppStorage,
}                                       from "./utils/rateAppStorage";

// ── Constants ─────────────────────────────────────────────────────────────────
export {
  RATE_APP_CONFIG,
  STORAGE_KEYS,
  POSTHOG_EVENTS,
  FEEDBACK_CATEGORIES,
}                                       from "./constants/rateAppConfig";
