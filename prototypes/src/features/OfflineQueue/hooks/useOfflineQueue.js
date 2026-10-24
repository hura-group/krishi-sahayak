/**
 * src/features/OfflineQueue/hooks/useOfflineQueue.js
 *
 * Exposes live queue state and the processQueue trigger.
 * Uses WatermelonDB's observe() so counts update in real time
 * as items are enqueued / synced — no polling needed.
 *
 * Mount once at your root navigator — all other components read from
 * the context it exports rather than each creating their own subscription.
 *
 * Usage:
 *   // Root:
 *   const queue = useOfflineQueue({ isOnline, supabase, userId });
 *   <OfflineQueueContext.Provider value={queue}>…</OfflineQueueContext.Provider>
 *
 *   // Anywhere in the tree:
 *   const { pendingCount, isSyncing } = useOfflineQueueContext();
 */

import {
  useState, useEffect, useCallback,
  useRef, createContext, useContext,
} from "react";
import { Q }        from "@nozbe/watermelondb";
import { v4 as uuidv4 } from "uuid";

import { queueDatabase }    from "../db/schema";
import OfflineQueueItem     from "../db/OfflineQueueItem";
import {
  processQueue,
  getCounts,
  clearCompleted,
  resetFailed,
  enqueue,
}                           from "../services/queueService";
import { QUEUE_STATUS, QUEUE_CONFIG, ACTION_LABELS } from "../constants/queueConfig";

// ─── Context (optional — use if you want to avoid prop-drilling) ──────────────

export const OfflineQueueContext = createContext(null);

export function useOfflineQueueContext() {
  const ctx = useContext(OfflineQueueContext);
  if (!ctx) throw new Error("useOfflineQueueContext must be used inside OfflineQueueContext.Provider");
  return ctx;
}

// ─── Progress state ───────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   currentItem:   { actionType: string, index: number, total: number } | null,
 *   completedItems:{ actionType: string, success: boolean, error?: string }[],
 *   phase:         "idle" | "syncing" | "done" | "partial_failure",
 *   synced:        number,
 *   failed:        number,
 * }} SyncProgress
 */

const INITIAL_PROGRESS = {
  currentItem:    null,
  completedItems: [],
  phase:          "idle",
  synced:         0,
  failed:         0,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   isOnline:   boolean,
 *   supabase:   import("@supabase/supabase-js").SupabaseClient,
 *   userId:     string,
 *   onSyncDone?: (result: { synced: number, failed: number }) => void,
 * }} options
 */
export function useOfflineQueue({ isOnline, supabase, userId, onSyncDone }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount,  setFailedCount]  = useState(0);
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [progress,     setProgress]     = useState(INITIAL_PROGRESS);

  const syncingRef    = useRef(false);
  const prevOnlineRef = useRef(isOnline);

  // ── Live count observer ───────────────────────────────────────────────────

  useEffect(() => {
    const collection = queueDatabase.get(OfflineQueueItem.table);

    // Observe PENDING count
    const pendingSub = collection
      .query(Q.where("status", QUEUE_STATUS.PENDING))
      .observe()
      .subscribe((items) => setPendingCount(items.length));

    // Observe FAILED count
    const failedSub = collection
      .query(Q.where("status", QUEUE_STATUS.FAILED))
      .observe()
      .subscribe((items) => setFailedCount(items.length));

    return () => {
      pendingSub.unsubscribe();
      failedSub.unsubscribe();
    };
  }, []);

  // ── Cleanup completed items on mount ─────────────────────────────────────

  useEffect(() => {
    clearCompleted().catch((err) =>
      console.warn("[useOfflineQueue] clearCompleted error:", err)
    );
  }, []);

  // ── Process queue function ────────────────────────────────────────────────

  const runProcessQueue = useCallback(async () => {
    if (syncingRef.current || !isOnline || !userId) return;
    syncingRef.current = true;
    setIsSyncing(true);
    setProgress({ ...INITIAL_PROGRESS, phase: "syncing" });

    try {
      const result = await processQueue(supabase, userId, {
        onItemStart: (item, index, total) => {
          setProgress((prev) => ({
            ...prev,
            phase:       "syncing",
            currentItem: { actionType: item.actionType, index: index + 1, total },
          }));
        },
        onItemSuccess: (item) => {
          setProgress((prev) => ({
            ...prev,
            completedItems: [
              ...prev.completedItems,
              { actionType: item.actionType, success: true },
            ],
            synced:      prev.synced + 1,
            currentItem: null,
          }));
        },
        onItemError: (item, error, willRetry) => {
          setProgress((prev) => ({
            ...prev,
            completedItems: [
              ...prev.completedItems,
              { actionType: item.actionType, success: false, error: error.message, willRetry },
            ],
            failed:      prev.failed + 1,
            currentItem: null,
          }));
        },
        onComplete: ({ synced, failed }) => {
          setProgress((prev) => ({
            ...prev,
            phase:       failed > 0 ? "partial_failure" : "done",
            currentItem: null,
            synced,
            failed,
          }));
          onSyncDone?.({ synced, failed });
        },
      });

      return result;
    } catch (err) {
      console.error("[useOfflineQueue] processQueue error:", err);
      setProgress((prev) => ({ ...prev, phase: "partial_failure" }));
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, supabase, userId, onSyncDone]);

  // ── Auto-process on reconnect ─────────────────────────────────────────────

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline && pendingCount > 0) {
      const timer = setTimeout(
        runProcessQueue,
        QUEUE_CONFIG.PROCESS_ON_RECONNECT_DELAY
      );
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount, runProcessQueue]);

  // ── Reset progress after toast auto-dismisses ─────────────────────────────

  const resetProgress = useCallback(() => {
    setProgress(INITIAL_PROGRESS);
  }, []);

  // ── Manual retry of all failed items ─────────────────────────────────────

  const retryFailed = useCallback(async () => {
    await resetFailed();
    await runProcessQueue();
  }, [runProcessQueue]);

  return {
    /** Number of items waiting to sync */
    pendingCount,
    /** Number of items that failed all retry attempts */
    failedCount,
    /** True while a sync run is in flight */
    isSyncing,
    /** Granular progress for the SyncProgressToast */
    progress,
    /** Manually trigger a sync (also fires automatically on reconnect) */
    processQueue: runProcessQueue,
    /** Reset progress state (call when toast is dismissed) */
    resetProgress,
    /** Reset all FAILED items to PENDING then re-run sync */
    retryFailed,
    /** Direct enqueue — use useQueuedAction for cleaner DX */
    enqueue,
  };
}
