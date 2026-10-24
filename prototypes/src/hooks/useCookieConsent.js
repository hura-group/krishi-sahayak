/**
 * src/hooks/useCookieConsent.js
 *
 * Manages GDPR/cookie consent state.
 *
 * Consent is stored in localStorage (key: "kisan_cookie_consent") as a JSON
 * object with per-category values and a timestamp. A server-readable cookie
 * ("kisan_consent") is also set so Next.js middleware can check consent
 * server-side (e.g. to block analytics scripts in SSR).
 *
 * Consent expires after 12 months and is re-requested automatically.
 *
 * Usage:
 *   const { consent, hasDecided, saveConsent, openSettings } = useCookieConsent();
 *
 * Categories:
 *   necessary      — always true, cannot be turned off
 *   analytics      — usage tracking (Posthog, error logs)
 *   personalisation— remembers preferences, tailors content
 *   marketing      — third-party advertising pixels
 */

import { useState, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

export const CONSENT_STORAGE_KEY = "kisan_cookie_consent";
export const CONSENT_COOKIE_NAME = "kisan_consent";
export const CONSENT_TTL_MS      = 365 * 24 * 60 * 60 * 1000; // 12 months

export const DEFAULT_CONSENT = {
  necessary:       true,   // always on
  analytics:       false,
  personalisation: false,
  marketing:       false,
};

export const CONSENT_CATEGORIES = [
  {
    id:          "necessary",
    label:       "Strictly Necessary",
    description: "Required for the platform to function. Includes authentication sessions and security tokens. Cannot be disabled.",
    alwaysOn:    true,
  },
  {
    id:          "analytics",
    label:       "Analytics",
    description: "Helps us understand how farmers use the app so we can improve features. Data is anonymised where possible.",
    alwaysOn:    false,
  },
  {
    id:          "personalisation",
    label:       "Personalisation",
    description: "Remembers your preferences such as language, notification settings, and recently viewed crops.",
    alwaysOn:    false,
  },
  {
    id:          "marketing",
    label:       "Marketing",
    description: "Allows us to show relevant agricultural product ads on third-party platforms. No data is sold.",
    alwaysOn:    false,
  },
];

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadStoredConsent() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after TTL
    if (Date.now() - parsed.timestamp > CONSENT_TTL_MS) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistConsent(categories) {
  if (typeof window === "undefined") return;
  const record = { ...categories, timestamp: Date.now() };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
  } catch { /* ignore quota errors */ }

  // Set a server-readable cookie (HttpOnly not possible from JS, but readable by middleware)
  const expires = new Date(Date.now() + CONSENT_TTL_MS).toUTCString();
  const value   = encodeURIComponent(
    JSON.stringify({
      a: categories.analytics       ? 1 : 0,
      p: categories.personalisation ? 1 : 0,
      m: categories.marketing       ? 1 : 0,
    })
  );
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCookieConsent() {
  const [consent,      setConsent]      = useState(DEFAULT_CONSENT);
  const [hasDecided,   setHasDecided]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load persisted consent on mount
  useEffect(() => {
    const stored = loadStoredConsent();
    if (stored) {
      setConsent({
        necessary:       true,
        analytics:       stored.analytics       ?? false,
        personalisation: stored.personalisation ?? false,
        marketing:       stored.marketing       ?? false,
      });
      setHasDecided(true);
    }
  }, []);

  // Listen for "open-cookie-settings" events dispatched by LegalPageLayout footer
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    document.addEventListener("open-cookie-settings", handler);
    return () => document.removeEventListener("open-cookie-settings", handler);
  }, []);

  /**
   * Accept all non-necessary categories.
   */
  const acceptAll = useCallback(() => {
    const all = { necessary: true, analytics: true, personalisation: true, marketing: true };
    setConsent(all);
    setHasDecided(true);
    setSettingsOpen(false);
    persistConsent(all);
  }, []);

  /**
   * Reject all non-necessary categories.
   */
  const rejectAll = useCallback(() => {
    const minimal = { ...DEFAULT_CONSENT };
    setConsent(minimal);
    setHasDecided(true);
    setSettingsOpen(false);
    persistConsent(minimal);
  }, []);

  /**
   * Save a custom consent selection.
   * @param {{ analytics: boolean, personalisation: boolean, marketing: boolean }} custom
   */
  const saveConsent = useCallback((custom) => {
    const merged = { necessary: true, ...custom };
    setConsent(merged);
    setHasDecided(true);
    setSettingsOpen(false);
    persistConsent(merged);
  }, []);

  /**
   * Returns true if the user has consented to the given category.
   * @param {"analytics"|"personalisation"|"marketing"} category
   */
  const hasConsent = useCallback(
    (category) => consent[category] === true,
    [consent]
  );

  const openSettings  = useCallback(() => setSettingsOpen(true),  []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  return {
    consent,
    hasDecided,
    settingsOpen,
    acceptAll,
    rejectAll,
    saveConsent,
    hasConsent,
    openSettings,
    closeSettings,
  };
}
