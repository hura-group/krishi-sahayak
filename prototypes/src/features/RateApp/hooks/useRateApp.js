/**
 * src/features/RateApp/hooks/useRateApp.js
 *
 * Main orchestration hook for the Rate App flow.
 * Manages the full state machine: hidden → rate_prompt → feedback_form → thankyou
 *
 * Usage (mount once in your root navigator):
 *
 *   import { useRateApp, RateAppPrompt } from "@/features/RateApp";
 *
 *   export default function RootNavigator() {
 *     const rateApp = useRateApp();
 *     return (
 *       <>
 *         <Stack />
 *         <RateAppPrompt controller={rateApp} />
 *       </>
 *     );
 *   }
 *
 * State machine:
 *
 *   HIDDEN
 *     ↓  (conditions met after 7th open)
 *   RATE_PROMPT  ─────── "Rate Now" ──────→ launch StoreReview → HIDDEN (rated=true)
 *       │
 *       ├── "Give Feedback" ──────────────→ FEEDBACK_FORM
 *       │
 *       └── "Later" / dismiss ────────────→ HIDDEN (90-day cooldown set)
 *
 *   FEEDBACK_FORM
 *       │
 *       ├── submit ───────────────────────→ THANKYOU → HIDDEN (2 s auto-close)
 *       │
 *       └── cancel ───────────────────────→ HIDDEN (90-day cooldown set)
 *
 *   THANKYOU  (shown for 2 s, then auto-hides)
 */

import { useState, useCallback, useRef } from "react";
import * as StoreReview                  from "expo-store-review";
import {
  recordPromptShown,
  markVersionAsShown,
  markUserRated,
  markFeedbackGiven,
}                                        from "../utils/rateAppStorage";
import {
  trackPromptShown,
  trackPromptResponded,
  trackFeedbackSubmitted,
}                                        from "../utils/rateAppAnalytics";
import { getAppVersion, getMajorVersion } from "./useAppOpenTracker";

// ─── State machine values ─────────────────────────────────────────────────────

export const RATE_APP_STATE = {
  HIDDEN:        "hidden",
  RATE_PROMPT:   "rate_prompt",
  FEEDBACK_FORM: "feedback_form",
  THANKYOU:      "thankyou",
};

const THANKYOU_DURATION_MS = 2_500;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRateApp() {
  const [state,     setState]     = useState(RATE_APP_STATE.HIDDEN);
  const openCountRef = useRef(0);
  const thankYouTimerRef = useRef(null);

  const appVersion   = getAppVersion();
  const majorVersion = getMajorVersion(appVersion);

  // ── Show the rate prompt ───────────────────────────────────────────────────

  /**
   * Called by useAppOpenTracker when all conditions are met.
   * @param {number} openCount  current app open count
   */
  const maybeShow = useCallback(async (openCount) => {
    openCountRef.current = openCount;

    // Record timing + PostHog before showing
    await recordPromptShown();
    await markVersionAsShown(majorVersion);
    trackPromptShown({ appVersion, openCount });

    setState(RATE_APP_STATE.RATE_PROMPT);
  }, [appVersion, majorVersion]);

  // ── User actions ───────────────────────────────────────────────────────────

  /**
   * User tapped "Rate Now" — launch native store review, then close.
   */
  const handleRateNow = useCallback(async () => {
    trackPromptResponded({
      appVersion,
      openCount: openCountRef.current,
      action:    "rated",
    });

    setState(RATE_APP_STATE.HIDDEN);

    try {
      const available = await StoreReview.isAvailableAsync();
      if (available) {
        await StoreReview.requestReview();
      } else {
        // Fallback: open store listing directly
        await StoreReview.openStoreFrontAsync();
      }
    } catch (err) {
      console.warn("[RateApp] StoreReview error:", err);
    }

    await markUserRated();
  }, [appVersion]);

  /**
   * User tapped "Give Feedback" — transition to feedback form.
   */
  const handleGiveFeedback = useCallback(() => {
    trackPromptResponded({
      appVersion,
      openCount: openCountRef.current,
      action:    "declined_feedback",
    });
    setState(RATE_APP_STATE.FEEDBACK_FORM);
  }, [appVersion]);

  /**
   * User tapped "Later" or dismissed the rate prompt sheet.
   * Cooldown has already been set by recordPromptShown().
   */
  const handleDismissPrompt = useCallback(() => {
    trackPromptResponded({
      appVersion,
      openCount: openCountRef.current,
      action:    "declined_dismissed",
    });
    setState(RATE_APP_STATE.HIDDEN);
  }, [appVersion]);

  /**
   * User submitted the feedback form.
   * @param {{ starRating: number, categories: string[], message: string }} feedback
   */
  const handleFeedbackSubmit = useCallback(async (feedback) => {
    trackFeedbackSubmitted({
      appVersion,
      openCount:   openCountRef.current,
      starRating:  feedback.starRating,
      categories:  feedback.categories,
      hasMessage:  Boolean(feedback.message?.trim()),
    });

    await markFeedbackGiven();

    // Show thank-you for 2.5 s then auto-hide
    setState(RATE_APP_STATE.THANKYOU);
    thankYouTimerRef.current = setTimeout(() => {
      setState(RATE_APP_STATE.HIDDEN);
    }, THANKYOU_DURATION_MS);

    // TODO: send feedback.message to your support API here
    // await submitFeedbackToBackend({ ...feedback, appVersion, platform: Platform.OS });
  }, [appVersion]);

  /**
   * User cancelled / closed the feedback form.
   */
  const handleFeedbackCancel = useCallback(() => {
    setState(RATE_APP_STATE.HIDDEN);
  }, []);

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    /** Current state machine value */
    state,

    /** Computed booleans for clean conditional rendering */
    isVisible:        state !== RATE_APP_STATE.HIDDEN,
    showRatePrompt:   state === RATE_APP_STATE.RATE_PROMPT,
    showFeedbackForm: state === RATE_APP_STATE.FEEDBACK_FORM,
    showThankYou:     state === RATE_APP_STATE.THANKYOU,

    /** Call this from useAppOpenTracker's onEligible callback */
    maybeShow,

    /** Handlers — pass to <RateAppPrompt controller={rateApp} /> */
    onRateNow:        handleRateNow,
    onGiveFeedback:   handleGiveFeedback,
    onDismissPrompt:  handleDismissPrompt,
    onFeedbackSubmit: handleFeedbackSubmit,
    onFeedbackCancel: handleFeedbackCancel,

    /** Metadata */
    appVersion,
    majorVersion,
  };
}
