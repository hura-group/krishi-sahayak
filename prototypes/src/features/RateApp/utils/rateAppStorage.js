/**
 * src/features/RateApp/utils/rateAppStorage.js
 *
 * AsyncStorage helpers for the Rate App flow.
 * All functions are error-safe — a storage failure never crashes the app.
 *
 * Schema overview:
 *   kisan_rate_open_count       integer (JSON)
 *   kisan_rate_last_shown_at    ISO 8601 string
 *   kisan_rate_shown_versions   JSON string[]  e.g. ["1","2"]
 *   kisan_rate_next_eligible_at ISO 8601 string
 *   kisan_rate_user_rated       "true" | null
 *   kisan_rate_feedback_given   "true" | null
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, RATE_APP_CONFIG } from "../constants/rateAppConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns Date that is `days` from now */
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ─── App open count ───────────────────────────────────────────────────────────

/**
 * Increments the lifetime app open counter by 1.
 * @returns {Promise<number>} new count
 */
export async function incrementOpenCount() {
  try {
    const raw   = await AsyncStorage.getItem(STORAGE_KEYS.OPEN_COUNT);
    const count = raw ? parseInt(raw, 10) : 0;
    const next  = count + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.OPEN_COUNT, String(next));
    return next;
  } catch (err) {
    console.warn("[RateApp] incrementOpenCount error:", err);
    return 0;
  }
}

/**
 * Returns the current app open count.
 * @returns {Promise<number>}
 */
export async function getOpenCount() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.OPEN_COUNT);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

// ─── Version tracking ─────────────────────────────────────────────────────────

/**
 * Returns the list of major versions that have already been prompted.
 * @returns {Promise<string[]>}
 */
export async function getShownVersions() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SHOWN_VERSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Marks a major version as "already prompted" so we don't show again.
 * @param {string} majorVersion  e.g. "2"
 */
export async function markVersionAsShown(majorVersion) {
  try {
    const existing = await getShownVersions();
    if (!existing.includes(majorVersion)) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHOWN_VERSIONS,
        JSON.stringify([...existing, majorVersion])
      );
    }
  } catch (err) {
    console.warn("[RateApp] markVersionAsShown error:", err);
  }
}

// ─── Cooldown / scheduling ────────────────────────────────────────────────────

/**
 * Returns true if the current time is past the next eligible date.
 * Also returns true if no next eligible date is stored (first time).
 * @returns {Promise<boolean>}
 */
export async function isEligibleByTime() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NEXT_ELIGIBLE_AT);
    if (!raw) return true; // never shown before
    return new Date() >= new Date(raw);
  } catch {
    return true;
  }
}

/**
 * Records that the prompt was shown now and sets the next eligible date
 * to `COOLDOWN_DAYS` from today.
 */
export async function recordPromptShown() {
  try {
    const now  = new Date().toISOString();
    const next = daysFromNow(RATE_APP_CONFIG.COOLDOWN_DAYS).toISOString();
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.LAST_SHOWN_AT,    now],
      [STORAGE_KEYS.NEXT_ELIGIBLE_AT, next],
    ]);
  } catch (err) {
    console.warn("[RateApp] recordPromptShown error:", err);
  }
}

/**
 * Returns when the next prompt is eligible to show (for debugging).
 * @returns {Promise<Date|null>}
 */
export async function getNextEligibleDate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.NEXT_ELIGIBLE_AT);
    return raw ? new Date(raw) : null;
  } catch {
    return null;
  }
}

// ─── User responses ───────────────────────────────────────────────────────────

/**
 * Records that the user tapped "Rate Now" and we launched the store prompt.
 */
export async function markUserRated() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_RATED, "true");
  } catch (err) {
    console.warn("[RateApp] markUserRated error:", err);
  }
}

/**
 * Records that the user submitted the fallback feedback form.
 */
export async function markFeedbackGiven() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FEEDBACK_GIVEN, "true");
  } catch (err) {
    console.warn("[RateApp] markFeedbackGiven error:", err);
  }
}

/**
 * Returns whether the user has previously rated (tapped "Rate Now").
 * @returns {Promise<boolean>}
 */
export async function hasUserRated() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_RATED);
    return raw === "true";
  } catch {
    return false;
  }
}

// ─── Full eligibility check ───────────────────────────────────────────────────

/**
 * Checks all conditions for showing the rate prompt.
 *
 * Conditions (all must pass):
 *   1. Open count >= OPENS_REQUIRED
 *   2. Current time >= next eligible date (cooldown cleared)
 *   3. Current major version has not been prompted before
 *   4. User has not already rated
 *
 * @param {string} currentMajorVersion  e.g. "2"
 * @returns {Promise<{ eligible: boolean, reason: string }>}
 */
export async function checkEligibility(currentMajorVersion) {
  try {
    const [openCount, timeOk, shownVersions, rated] = await Promise.all([
      getOpenCount(),
      isEligibleByTime(),
      getShownVersions(),
      hasUserRated(),
    ]);

    if (rated) {
      return { eligible: false, reason: "already_rated" };
    }
    if (RATE_APP_CONFIG.ONCE_PER_MAJOR_VERSION && shownVersions.includes(currentMajorVersion)) {
      return { eligible: false, reason: "version_already_shown" };
    }
    if (!timeOk) {
      return { eligible: false, reason: "in_cooldown" };
    }
    if (openCount < RATE_APP_CONFIG.OPENS_REQUIRED) {
      return { eligible: false, reason: `opens_${openCount}_of_${RATE_APP_CONFIG.OPENS_REQUIRED}` };
    }

    return { eligible: true, reason: "all_conditions_met" };
  } catch (err) {
    console.warn("[RateApp] checkEligibility error:", err);
    return { eligible: false, reason: "storage_error" };
  }
}

// ─── Debug reset (development only) ──────────────────────────────────────────

/**
 * Clears all Rate App storage. Use in development only.
 * Example: call from a hidden dev menu to re-trigger the flow.
 */
export async function __devResetRateAppStorage() {
  if (!__DEV__) return;
  await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  console.log("[RateApp] Dev reset complete");
}
