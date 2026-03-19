/**
 * Krishi Sahayak — Core Analytics Events
 * 15 events tracked via PostHog
 */

export const ANALYTICS_EVENTS = {
  // ── App lifecycle ──────────────────────────────────────────
  APP_OPEN: 'app_open',                         // App launched / foregrounded
  APP_BACKGROUND: 'app_background',             // App sent to background

  // ── Auth ──────────────────────────────────────────────────
  OTP_SENT: 'otp_sent',                         // OTP requested
  OTP_VERIFIED: 'otp_verified',                 // OTP verified successfully
  OTP_FAILED: 'otp_failed',                     // OTP verification failed
  LOGOUT: 'logout',                             // User logged out

  // ── Onboarding ────────────────────────────────────────────
  ONBOARDING_STARTED: 'onboarding_started',     // First time user starts onboarding
  ONBOARDING_COMPLETED: 'onboarding_completed', // User completed onboarding

  // ── Weather ───────────────────────────────────────────────
  WEATHER_VIEWED: 'weather_viewed',             // Weather screen opened
  WEATHER_LOCATION_CHANGED: 'weather_location_changed', // User changed location

  // ── Crop / Advisory ───────────────────────────────────────
  CROP_SELECTED: 'crop_selected',               // User picks a crop
  ADVISORY_VIEWED: 'advisory_viewed',           // Advisory detail opened

  // ── Market ────────────────────────────────────────────────
  MARKET_PRICE_VIEWED: 'market_price_viewed',   // Mandi price screen opened

  // ── Navigation ────────────────────────────────────────────
  TAB_SWITCHED: 'tab_switched',                 // Bottom tab changed

  // ── Errors ────────────────────────────────────────────────
  API_ERROR: 'api_error',                       // Any API call failure
} as const;

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

// ── Per-event property types ───────────────────────────────────────────────────

export interface EventProperties {
  app_open: {
    source?: 'cold_start' | 'background_resume';
    locale?: string;
  };
  app_background: Record<string, never>;
  otp_sent: {
    phone_masked: string;   // e.g. "+91 ****1234"
  };
  otp_verified: {
    phone_masked: string;
    is_new_user: boolean;
  };
  otp_failed: {
    phone_masked: string;
    reason?: string;
  };
  logout: Record<string, never>;
  onboarding_started: Record<string, never>;
  onboarding_completed: {
    duration_seconds: number;
  };
  weather_viewed: {
    location_name: string;
    source: 'gps' | 'manual';
  };
  weather_location_changed: {
    from: string;
    to: string;
  };
  crop_selected: {
    crop_name: string;
    crop_id: string;
  };
  advisory_viewed: {
    advisory_id: string;
    advisory_type: string;
    crop_name?: string;
  };
  market_price_viewed: {
    commodity: string;
    mandi_name?: string;
  };
  tab_switched: {
    from_tab: string;
    to_tab: string;
  };
  api_error: {
    endpoint: string;
    status_code?: number;
    message?: string;
  };
}
