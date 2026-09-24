/**
 * src/features/OfflineQueue/constants/queueConfig.js
 *
 * Single source of truth for all Offline Write Queue configuration:
 * action types, priorities, statuses, retry limits, and UI labels.
 */

// ─── Action types ─────────────────────────────────────────────────────────────

/**
 * Every write action that can be queued while offline.
 * The key matches the `action_type` column in WatermelonDB.
 */
export const ACTION_TYPE = {
  PEST_DETECTION:  "pest_detection",
  EXPENSE_ADD:     "expense_add",
  POST_CREATE:     "post_create",
  LISTING_CREATE:  "listing_create",
};

// ─── Queue item status ────────────────────────────────────────────────────────

export const QUEUE_STATUS = {
  PENDING:    "pending",     // waiting to be processed
  PROCESSING: "processing",  // currently being sent to server
  DONE:       "done",        // successfully synced
  FAILED:     "failed",      // exhausted retries — needs manual intervention
};

// ─── Priority (lower number = processed first) ────────────────────────────────

/**
 * Processing order when multiple items are queued.
 * Pest detections are high priority (time-sensitive crop safety),
 * listings are lowest (can wait).
 */
export const ACTION_PRIORITY = {
  [ACTION_TYPE.PEST_DETECTION]: 1,
  [ACTION_TYPE.EXPENSE_ADD]:    2,
  [ACTION_TYPE.POST_CREATE]:    3,
  [ACTION_TYPE.LISTING_CREATE]: 4,
};

// ─── Timing and retry ─────────────────────────────────────────────────────────

export const QUEUE_CONFIG = {
  /** Max attempts before marking an item as FAILED */
  MAX_ATTEMPTS:               3,

  /** Base ms for exponential back-off between retries: 2s, 4s, 8s */
  RETRY_BACKOFF_BASE_MS:      2_000,

  /** Delay (ms) after reconnecting before starting the queue processor */
  PROCESS_ON_RECONNECT_DELAY: 1_500,

  /** How long the per-item progress toast stays visible after success */
  ITEM_TOAST_DURATION_MS:     3_000,

  /** How long the completion summary toast stays visible */
  DONE_TOAST_DURATION_MS:     5_000,

  /**
   * Conflict resolution strategy.
   * "last_write_wins" — the queued (client) value always overwrites the server
   * value. Acceptable for MVP; upgrade to CRDTs or server-side merge later.
   */
  CONFLICT_STRATEGY:          "last_write_wins",
};

// ─── UI labels ────────────────────────────────────────────────────────────────

/** Human-readable labels for each action type */
export const ACTION_LABELS = {
  [ACTION_TYPE.PEST_DETECTION]: {
    noun:       "Pest Detection",
    verb:       "Submitting pest report",
    icon:       "pest_control",
    doneMsg:    "Pest detection uploaded",
  },
  [ACTION_TYPE.EXPENSE_ADD]: {
    noun:       "Expense",
    verb:       "Saving expense entry",
    icon:       "payments",
    doneMsg:    "Expense saved",
  },
  [ACTION_TYPE.POST_CREATE]: {
    noun:       "Community Post",
    verb:       "Publishing post",
    icon:       "forum",
    doneMsg:    "Post published",
  },
  [ACTION_TYPE.LISTING_CREATE]: {
    noun:       "Market Listing",
    verb:       "Creating listing",
    icon:       "storefront",
    doneMsg:    "Listing live on marketplace",
  },
};
