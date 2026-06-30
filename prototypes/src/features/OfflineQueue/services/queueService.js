/**
 * src/features/OfflineQueue/services/queueService.js
 *
 * Core service layer for the Offline Write Queue.
 * All WatermelonDB reads/writes go through this file — hooks and components
 * never touch the database directly.
 *
 * Responsibilities:
 *   • enqueue()        — add a new item (deduplication via clientId)
 *   • processQueue()   — ordered sync loop with per-item callbacks
 *   • getCounts()      — pending / failed / total counts
 *   • clearCompleted() — housekeeping (removes DONE items)
 *   • resetFailed()    — resets FAILED items back to PENDING for manual retry
 */

import { Q }            from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

import { queueDatabase }       from "../db/schema";
import OfflineQueueItem        from "../db/OfflineQueueItem";
import { processQueueItem }    from "../processors/actionProcessors";
import {
  ACTION_PRIORITY,
  QUEUE_STATUS,
  QUEUE_CONFIG,
}                              from "../constants/queueConfig";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const collection = () =>
  queueDatabase.get(OfflineQueueItem.table);

/** Exponential back-off delay: attempt 1 → 2 s, 2 → 4 s, 3 → 8 s */
const backoffMs = (attempt) =>
  QUEUE_CONFIG.RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt - 1);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Enqueue ──────────────────────────────────────────────────────────────────

/**
 * Adds a new write action to the offline queue.
 * Idempotent: if a PENDING or PROCESSING item with the same clientId already
 * exists it is returned as-is (prevents double-queuing on double-tap).
 *
 * @param {string}  actionType  — one of ACTION_TYPE constants
 * @param {object}  payload     — action-specific data (see actionProcessors.js)
 * @param {string}  [clientId]  — optional override; auto-generated if omitted
 * @returns {Promise<string>}   the clientId of the queued item
 */
export async function enqueue(actionType, payload, clientId = uuidv4()) {
  // Check for existing item with the same clientId
  const existing = await collection()
    .query(
      Q.where("client_id", clientId),
      Q.where("status", Q.oneOf([QUEUE_STATUS.PENDING, QUEUE_STATUS.PROCESSING]))
    )
    .fetch();

  if (existing.length > 0) {
    return clientId; // already queued
  }

  await queueDatabase.write(async () => {
    await collection().create((item) => {
      item.actionType  = actionType;
      item._payload    = JSON.stringify({ ...payload, clientId });
      item.clientId    = clientId;
      item.status      = QUEUE_STATUS.PENDING;
      item.priority    = ACTION_PRIORITY[actionType] ?? 99;
      item.attempts    = 0;
      item.createdAt   = Date.now();
    });
  });

  return clientId;
}

// ─── Process queue ────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   onItemStart:   (item: OfflineQueueItem, index: number, total: number) => void,
 *   onItemSuccess: (item: OfflineQueueItem, index: number, total: number) => void,
 *   onItemError:   (item: OfflineQueueItem, error: Error, willRetry: boolean) => void,
 *   onComplete:    (result: { synced: number, failed: number }) => void,
 * }} ProcessCallbacks
 */

/**
 * Processes all PENDING items in priority → created_at order.
 * Calls back at each lifecycle point so UI components can show progress.
 *
 * Conflict strategy: last_write_wins — each processor uses upsert so the
 * queued value always overwrites whatever is currently on the server.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string}           userId
 * @param {ProcessCallbacks} callbacks
 * @returns {Promise<{ synced: number, failed: number }>}
 */
export async function processQueue(supabase, userId, callbacks = {}) {
  const { onItemStart, onItemSuccess, onItemError, onComplete } = callbacks;

  // Fetch all pending items ordered by priority then created_at
  const pending = await collection()
    .query(
      Q.where("status", QUEUE_STATUS.PENDING),
      Q.sortBy("priority",   Q.asc),
      Q.sortBy("created_at", Q.asc)
    )
    .fetch();

  if (pending.length === 0) {
    onComplete?.({ synced: 0, failed: 0 });
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];

    // Mark as processing
    await queueDatabase.write(async () => {
      await item.update((rec) => {
        rec.status = QUEUE_STATUS.PROCESSING;
      });
    });

    onItemStart?.(item, i, pending.length);

    try {
      await processQueueItem(item, supabase, userId);

      // Success — mark done
      await queueDatabase.write(async () => {
        await item.update((rec) => {
          rec.status       = QUEUE_STATUS.DONE;
          rec.processedAt  = Date.now();
          rec.error        = null;
        });
      });

      onItemSuccess?.(item, i, pending.length);
      synced++;

    } catch (err) {
      const nextAttempts = item.attempts + 1;
      const exhausted    = nextAttempts >= QUEUE_CONFIG.MAX_ATTEMPTS;
      const newStatus    = exhausted ? QUEUE_STATUS.FAILED : QUEUE_STATUS.PENDING;

      await queueDatabase.write(async () => {
        await item.update((rec) => {
          rec.status   = newStatus;
          rec.attempts = nextAttempts;
          rec.error    = err.message ?? "Unknown error";
        });
      });

      onItemError?.(item, err, !exhausted);
      failed++;

      // Back-off before retrying in the same run
      if (!exhausted) {
        await sleep(backoffMs(nextAttempts));
      }
    }
  }

  onComplete?.({ synced, failed });
  return { synced, failed };
}

// ─── Counts ───────────────────────────────────────────────────────────────────

/**
 * Returns pending / failed / total counts.
 * @returns {Promise<{ pending: number, failed: number, total: number }>}
 */
export async function getCounts() {
  const [pending, failed, total] = await Promise.all([
    collection().query(Q.where("status", QUEUE_STATUS.PENDING)).fetchCount(),
    collection().query(Q.where("status", QUEUE_STATUS.FAILED)).fetchCount(),
    collection().query().fetchCount(),
  ]);
  return { pending, failed, total };
}

/**
 * Returns all items with PENDING or FAILED status, for the settings list view.
 * @returns {Promise<OfflineQueueItem[]>}
 */
export async function getPendingItems() {
  return collection()
    .query(
      Q.where("status", Q.oneOf([QUEUE_STATUS.PENDING, QUEUE_STATUS.FAILED])),
      Q.sortBy("priority",   Q.asc),
      Q.sortBy("created_at", Q.asc)
    )
    .fetch();
}

// ─── Housekeeping ─────────────────────────────────────────────────────────────

/**
 * Deletes all DONE items older than `olderThanMs` milliseconds.
 * Call periodically (e.g. on app start) to prevent DB bloat.
 * @param {number} olderThanMs  default: 48 hours
 */
export async function clearCompleted(olderThanMs = 48 * 60 * 60 * 1000) {
  const cutoff = Date.now() - olderThanMs;
  const done   = await collection()
    .query(
      Q.where("status",       QUEUE_STATUS.DONE),
      Q.where("processed_at", Q.lt(cutoff))
    )
    .fetch();

  await queueDatabase.write(async () => {
    for (const item of done) {
      await item.destroyPermanently();
    }
  });

  return done.length;
}

/**
 * Resets all FAILED items back to PENDING and clears their error.
 * Call when user taps "Retry all failed" in Settings.
 */
export async function resetFailed() {
  const failed = await collection()
    .query(Q.where("status", QUEUE_STATUS.FAILED))
    .fetch();

  await queueDatabase.write(async () => {
    for (const item of failed) {
      await item.update((rec) => {
        rec.status   = QUEUE_STATUS.PENDING;
        rec.attempts = 0;
        rec.error    = null;
      });
    }
  });

  return failed.length;
}
