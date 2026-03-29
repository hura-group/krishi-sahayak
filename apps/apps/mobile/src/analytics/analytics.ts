import PostHog from 'posthog-react-native';
import { ANALYTICS_EVENTS, AnalyticsEvent, EventProperties } from './events';

// ── Singleton PostHog client ───────────────────────────────────────────────────

let _client: PostHog | null = null;

export function getPostHogClient(): PostHog {
  if (!_client) {
    throw new Error(
      '[Analytics] PostHog client not initialised. ' +
      'Ensure <PostHogProvider> wraps your app root before calling track().'
    );
  }
  return _client;
}

/** Called once by PostHogProvider after client is ready. */
export function setPostHogClient(client: PostHog) {
  _client = client;
}

// ── Typed track() ─────────────────────────────────────────────────────────────

/**
 * Fire a typed analytics event.
 *
 * @example
 * track('weather_viewed', { location_name: 'Pune', source: 'gps' });
 */
export function track<E extends AnalyticsEvent>(
  event: E,
  properties?: EventProperties[E extends keyof EventProperties ? E : never]
): void {
  try {
    const client = getPostHogClient();
    client.capture(event, properties ?? {});

    if (__DEV__) {
      console.log(`[Analytics] ${event}`, properties ?? {});
    }
  } catch (err) {
    // Never crash the app over analytics
    if (__DEV__) {
      console.warn('[Analytics] track() failed:', err);
    }
  }
}

/**
 * Identify a logged-in user.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  try {
    getPostHogClient().identify(userId, traits);
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] identify() failed:', err);
  }
}

/**
 * Reset identity on logout.
 */
export function resetUser(): void {
  try {
    getPostHogClient().reset();
  } catch (err) {
    if (__DEV__) console.warn('[Analytics] reset() failed:', err);
  }
}

// Re-export events for convenience
export { ANALYTICS_EVENTS };
