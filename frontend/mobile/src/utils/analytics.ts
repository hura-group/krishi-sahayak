// ─────────────────────────────────────────────────────────────────────────────
// KrishiSahayak — Analytics Helper
// ─────────────────────────────────────────────────────────────────────────────
import PostHog from 'posthog-react-native';

export type EventName =
  | 'app_open'
  | 'otp_sent'
  | 'otp_verified'
  | 'otp_failed'
  | 'profile_completed'
  | 'weather_viewed'
  | 'market_price_viewed'
  | 'pest_scan_started'
  | 'pest_scan_completed'
  | 'pest_scan_failed'
  | 'scheme_viewed'
  | 'post_created'
  | 'expense_added'
  | 'notification_opened'
  | 'marketplace_listing_viewed';

export interface EventProperties {
  app_open: { source?: 'cold_start' | 'notification' | 'background' };
  otp_sent: { phone_hash?: string };
  otp_verified: { phone_hash?: string };
  otp_failed: { attempt_number?: number };
  profile_completed: { state?: string; land_size_acres?: number; crop_count?: number };
  weather_viewed: { state?: string; district?: string; source?: 'home_widget' | 'bottom_nav' | 'deep_link' };
  market_price_viewed: { commodity?: string; state?: string; source?: 'home_ticker' | 'bottom_nav' | 'price_alert' };
  pest_scan_started: { source?: 'fab_button' | 'home_action' | 'deep_link' };
  pest_scan_completed: { disease_name?: string; confidence_score?: number; confidence_bucket?: 'low' | 'medium' | 'high'; crop_name?: string };
  pest_scan_failed: { error_type?: 'api_error' | 'timeout' | 'rate_limit' | 'bad_image' };
  scheme_viewed: { scheme_name?: string; eligibility_status?: 'eligible' | 'may_be_eligible' | 'not_eligible' };
  post_created: { category?: string; has_image?: boolean; character_count?: number };
  expense_added: { category?: string; amount_bucket?: 'small' | 'medium' | 'large'; has_receipt?: boolean };
  notification_opened: { notification_type?: string; time_to_open_seconds?: number };
  marketplace_listing_viewed: { listing_category?: string; state?: string; source?: 'grid' | 'search' | 'deep_link' };
}

let _posthog: PostHog | null = null;

export function setPostHogInstance(instance: PostHog): void {
  _posthog = instance;
}

export function track<E extends EventName>(event: E, properties?: EventProperties[E]): void {
  if (!_posthog) {
    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties ?? {});
    }
    return;
  }
  _posthog.capture(event, {
    ...properties,
    app_env: process.env.APP_ENV ?? 'development',
  });
}

export function identify(userId: string, traits?: { name?: string; state?: string; district?: string; preferred_lang?: string; land_size_acres?: number; role?: string }): void {
  if (!_posthog) return;
  _posthog.identify(userId, traits);
}

export function reset(): void {
  if (!_posthog) return;
  _posthog.reset();
}