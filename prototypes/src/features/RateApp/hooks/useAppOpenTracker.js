/**
 * src/features/RateApp/hooks/useAppOpenTracker.js
 *
 * Tracks app opens and fires a callback when the rate-app conditions are met.
 * Uses AppState to detect foreground transitions so each active session
 * counts as exactly one open — regardless of how many re-renders occur.
 *
 * Mount once in your root navigator or App.js:
 *   useAppOpenTracker({ onEligible: () => rateApp.maybeShow() });
 *
 * @param {{
 *   onEligible: (openCount: number) => void,
 *   disabled?:  boolean,
 * }} options
 */

import { useEffect, useRef, useCallback } from "react";
import { AppState }                        from "react-native";
import Constants                           from "expo-constants";
import {
  incrementOpenCount,
  checkEligibility,
}                                          from "../utils/rateAppStorage";
import { RATE_APP_CONFIG }                 from "../constants/rateAppConfig";

/**
 * Extracts the major version string from a semver string.
 * "2.4.1" → "2"   |   "10.0.0" → "10"   |   undefined → "0"
 */
export function getMajorVersion(version) {
  if (!version) return "0";
  return String(version).split(".")[0] ?? "0";
}

/**
 * Returns the current app version from expo-constants.
 * Falls back to "1.0.0" so the logic never crashes.
 */
export function getAppVersion() {
  return (
    Constants.expoConfig?.version ??
    Constants.manifest?.version ??    // SDK < 46
    "1.0.0"
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppOpenTracker({ onEligible, disabled = false } = {}) {
  const appStateRef     = useRef(AppState.currentState);
  const hasCheckedRef   = useRef(false);    // prevent double-fire per session
  const timerRef        = useRef(null);

  const checkAndFire = useCallback(async () => {
    if (disabled || hasCheckedRef.current) return;

    const appVersion   = getAppVersion();
    const majorVersion = getMajorVersion(appVersion);

    // Increment first, then check
    const newCount = await incrementOpenCount();
    const { eligible, reason } = await checkEligibility(majorVersion);

    if (__DEV__) {
      console.log(`[RateApp] Open #${newCount} · eligible=${eligible} · reason=${reason}`);
    }

    if (eligible) {
      hasCheckedRef.current = true; // don't fire again this session

      // Delay so the user isn't immediately interrupted on app open
      timerRef.current = setTimeout(() => {
        onEligible?.(newCount);
      }, RATE_APP_CONFIG.SHOW_DELAY_MS);
    }
  }, [disabled, onEligible]);

  // ── AppState listener ──────────────────────────────────────────────────────
  // Count a "new open" on:
  //   - Initial mount (cold start)
  //   - App coming to foreground from background

  useEffect(() => {
    if (disabled) return;

    // Cold start — count on first mount
    checkAndFire();

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      // Foreground transition (background → active, or inactive → active)
      if (
        (prev === "background" || prev === "inactive") &&
        nextState === "active"
      ) {
        hasCheckedRef.current = false;  // allow a fresh check on each foreground
        checkAndFire();
      }
    });

    return () => {
      subscription.remove();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [disabled, checkAndFire]);
}
