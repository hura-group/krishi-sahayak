/**
 * Krishi Sahayak — Core Analytics Events
 * Core events tracked via PostHog
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
  MARKET_PRICES_REFRESHED: 'market_prices_refreshed',
  PRICE_ALERT_CREATED: 'price_alert_created',
  PRICE_ALERT_STATUS_CHANGED: 'price_alert_status_changed',
  PRICE_ALERT_DELETED: 'price_alert_deleted',
  MANDI_SELECTED: 'mandi_selected',
  MANDI_DIRECTIONS_OPENED: 'mandi_directions_opened',

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
    auth_method: 'sms';
  };
  otp_verified: {
    auth_method: 'sms';
  };
  otp_failed: {
    auth_method: 'sms';
    stage: 'request' | 'verification';
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
  market_prices_refreshed: {
    current_result_count: number;
  };
  price_alert_created: {
    alert_id: string;
    crop_name: string;
    condition: 'above' | 'below';
  };
  price_alert_status_changed: {
    alert_id: string;
    is_active: boolean;
  };
  price_alert_deleted: {
    alert_id: string;
  };
  mandi_selected: {
    mandi_id: string;
    commodity_count: number;
    is_open_now: boolean;
  };
  mandi_directions_opened: {
    mandi_id: string;
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
