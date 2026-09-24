/**
 * src/features/Offline/hooks/useOfflineSync.js
 *
 * Manages a queue of actions that happened while offline and need
 * to be synced once connectivity is restored.
 *
 * Usage:
 *   const { syncCount, isSyncing, addToQueue } = useOfflineSync({
 *     isOnline,
 *     onSync: async (items) => { await api.batchSync(items); },
 *   });
 *
 *   // When user takes an offline action:
 *   addToQueue({ type: "crop_scan", payload: { cropId, imageUri } });
 *
 *   // SyncToast reads syncCount to show "Syncing 3 updates..."
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * @typedef {{
 *   id:        string,
 *   type:      string,
 *   payload:   unknown,
 *   addedAt:   Date,
 *   attempts:  number,
 * }} SyncQueueItem
 */

// ─── Storage helpers (survives page refresh) ──────────────────────────────────

const STORAGE_KEY = "kisan_offline_sync_queue";

function loadQueue() {
  try {
    const raw = typeof localStorage !== "undefined"
      ? localStorage.getItem(STORAGE_KEY)
      : null;
    if (!raw) return [];
    return JSON.parse(raw).map((item) => ({
      ...item,
      addedAt: new Date(item.addedAt),
    }));
  } catch {
    return [];
  }
}

function persistQueue(queue) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  } catch { /* ignore quota errors */ }
}

function clearPersistedQueue() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   isOnline:   boolean,
 *   onSync?:    (items: SyncQueueItem[]) => Promise<void>,
 *   onSyncDone?: (syncedCount: number) => void,
 * }} options
 */
export function useOfflineSync({ isOnline, onSync, onSyncDone } = {}) {
  const [queue,       setQueue]       = useState(loadQueue);
  const [isSyncing,   setIsSyncing]   = useState(false);
  const [lastSyncAt,  setLastSyncAt]  = useState(null);
  const [syncedCount, setSyncedCount] = useState(0);

  const prevOnlineRef = useRef(isOnline);
  const syncingRef    = useRef(false); // prevents concurrent syncs

  // ── Persist queue to localStorage whenever it changes ────────────────────

  useEffect(() => {
    persistQueue(queue);
  }, [queue]);

  // ── Add an item to the sync queue ─────────────────────────────────────────

  const addToQueue = useCallback((type, payload) => {
    const item = {
      id:       `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      addedAt:  new Date(),
      attempts: 0,
    };
    setQueue((prev) => [...prev, item]);
    return item.id;
  }, []);

  // ── Remove an item from the queue ─────────────────────────────────────────

  const removeFromQueue = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Run sync ──────────────────────────────────────────────────────────────

  const sync = useCallback(async () => {
    if (syncingRef.current || !isOnline) return;

    const currentQueue = loadQueue(); // fresh read from storage
    if (currentQueue.length === 0) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      if (onSync) {
        await onSync(currentQueue);
      }
      const count = currentQueue.length;
      clearPersistedQueue();
      setQueue([]);
      setLastSyncAt(new Date());
      setSyncedCount(count);
      onSyncDone?.(count);
    } catch (err) {
      console.error("[useOfflineSync] sync error:", err);
      // Increment attempt count for all items
      setQueue((prev) =>
        prev.map((item) => ({ ...item, attempts: item.attempts + 1 }))
      );
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, onSync, onSyncDone]);

  // ── Auto-sync when coming back online ─────────────────────────────────────

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline) {
      // Small delay so the UI can show the "back online" state first
      const timer = setTimeout(sync, 1_200);
      return () => clearTimeout(timer);
    }
  }, [isOnline, sync]);

  return {
    /** All items waiting to sync */
    queue,
    /** Number of pending items */
    syncCount:  queue.length,
    /** True while a sync is in flight */
    isSyncing,
    /** Timestamp of last successful sync */
    lastSyncAt,
    /** Number of items synced in the last run */
    syncedCount,
    /** Add an action to the queue */
    addToQueue,
    /** Remove a specific item */
    removeFromQueue,
    /** Manually trigger a sync attempt */
    syncNow: sync,
  };
}
