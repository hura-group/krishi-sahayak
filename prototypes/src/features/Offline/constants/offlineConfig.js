/**
 * src/features/Offline/constants/offlineConfig.js
 *
 * Single source of truth for all Offline Indicator behaviour thresholds,
 * timing values, and color tokens that match the KrishiSahayak design system.
 */

// ─── Timing ───────────────────────────────────────────────────────────────────

export const OFFLINE_CONFIG = {
  /** ms before the sync toast auto-dismisses after coming back online */
  SYNC_TOAST_DURATION_MS:     5_000,

  /** ms before showing the banner after losing connectivity (debounce) */
  BANNER_SHOW_DELAY_MS:       800,

  /** Stale cache threshold — badge turns amber above this */
  CACHE_STALE_MINUTES:        30,

  /** Max retry attempts before showing a "give up" state */
  RETRY_MAX_ATTEMPTS:         3,

  /** Base ms for exponential back-off between retries (1 s, 2 s, 4 s …) */
  RETRY_BACKOFF_BASE_MS:      1_000,

  /** How often to ping the health endpoint to verify connectivity */
  CONNECTIVITY_POLL_MS:       10_000,

  /** Lightweight URL to ping — returns 204 No Content */
  CONNECTIVITY_PING_URL:      "/api/ping",
};

// ─── Design tokens (match Tailwind config in the HTML) ────────────────────────

export const OFFLINE_COLORS = {
  /** earth-red — offline / error state */
  error:            "#79564B",
  errorContainer:   "#ffdad6",
  onErrorContainer: "#93000a",

  /** primary emerald — online / success state */
  primary:          "#003925",
  primaryContainer: "#0f5238",
  onPrimary:        "#FFFFFF",

  /** secondary — syncing */
  secondary:        "#2c694e",
  secondaryContainer:"#aeeecb",

  /** surface */
  surface:          "#fafaf5",
  surfaceVariant:   "#e3e3de",
  surfaceDim:       "#dadad5",
  onSurface:        "#1a1c19",
  onSurfaceVariant: "#404943",

  /** amber warning for stale data */
  staleAmber:       "#B45309",
  staleAmberBg:     "#FEF3C7",
};

// ─── Cache staleness labels ────────────────────────────────────────────────────

/**
 * Returns a human-readable cache age label given a timestamp.
 * @param {Date|string|number} cachedAt
 * @returns {string}  e.g. "Cached 2 hours ago" | "Cached just now"
 */
export function formatCacheAge(cachedAt) {
  if (!cachedAt) return "Cached — unknown";
  const diffMs  = Date.now() - new Date(cachedAt).getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1)  return "Cached just now";
  if (diffMin < 60) return `Cached ${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `Cached ${diffH} hour${diffH > 1 ? "s" : ""} ago`;
  const diffD = Math.floor(diffH / 24);
  return `Cached ${diffD} day${diffD > 1 ? "s" : ""} ago`;
}

/**
 * Returns true if the cached data is considered stale.
 * @param {Date|string|number} cachedAt
 */
export function isCacheStale(cachedAt) {
  if (!cachedAt) return true;
  const diffMin = (Date.now() - new Date(cachedAt).getTime()) / 60_000;
  return diffMin > OFFLINE_CONFIG.CACHE_STALE_MINUTES;
}
