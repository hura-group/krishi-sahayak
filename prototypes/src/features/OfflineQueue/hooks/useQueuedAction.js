/**
 * src/features/OfflineQueue/hooks/useQueuedAction.js
 *
 * Wraps any write action so it automatically:
 *   • Tries the direct API call when online
 *   • Falls back to the offline queue when offline (or when the API call fails)
 *   • Returns a stable `execute` function the caller uses identically in both cases
 *
 * Usage:
 *
 *   const submitPest = useQueuedAction({
 *     actionType:  ACTION_TYPE.PEST_DETECTION,
 *     onlineAction: api.submitPestDetection,     // async fn
 *     isOnline,
 *   });
 *
 *   // In a button handler:
 *   const result = await submitPest.execute(payload);
 *   //   result.queued  = true  → saved offline, will sync later
 *   //   result.queued  = false → sent to server immediately
 *   //   result.error          → non-null if both paths failed
 */

import { useCallback, useState } from "react";
import { v4 as uuidv4 }         from "uuid";
import { enqueue }              from "../services/queueService";

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @template TPayload
 *
 * @param {{
 *   actionType:   string,
 *   onlineAction: (payload: TPayload) => Promise<unknown>,
 *   isOnline:     boolean,
 *   /** Called when the item is saved to the local queue (offline path) *\/
 *   onQueued?:    (clientId: string, payload: TPayload) => void,
 *   /** Called when the online API call succeeds *\/
 *   onSuccess?:   (result: unknown, payload: TPayload) => void,
 *   /** Called on any failure (queuing is not considered a failure) *\/
 *   onError?:     (error: Error, payload: TPayload) => void,
 * }} options
 */
export function useQueuedAction({
  actionType,
  onlineAction,
  isOnline,
  onQueued,
  onSuccess,
  onError,
}) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastError,   setLastError]   = useState(null);

  /**
   * @param {TPayload} payload
   * @returns {Promise<{
   *   queued:   boolean,
   *   clientId: string,
   *   result?:  unknown,
   *   error?:   Error | null,
   * }>}
   */
  const execute = useCallback(
    async (payload) => {
      setIsExecuting(true);
      setLastError(null);

      // Attach a stable client ID for idempotency
      const clientId = uuidv4();
      const enriched = { ...payload, clientId };

      // ── Online path ─────────────────────────────────────────────────────
      if (isOnline) {
        try {
          const result = await onlineAction(enriched);
          onSuccess?.(result, enriched);
          setIsExecuting(false);
          return { queued: false, clientId, result, error: null };
        } catch (err) {
          // Online call failed — fall through to queue (network hiccup / server error)
          console.warn(
            `[useQueuedAction] Online call failed for "${actionType}", queuing instead:`,
            err.message
          );
        }
      }

      // ── Offline / fallback path ──────────────────────────────────────────
      try {
        await enqueue(actionType, enriched, clientId);
        onQueued?.(clientId, enriched);
        setIsExecuting(false);
        return { queued: true, clientId, result: null, error: null };
      } catch (queueErr) {
        // Queue write itself failed (very rare — DB corruption etc.)
        const error = queueErr instanceof Error
          ? queueErr
          : new Error(String(queueErr));
        setLastError(error);
        onError?.(error, enriched);
        setIsExecuting(false);
        return { queued: false, clientId, result: null, error };
      }
    },
    [actionType, onlineAction, isOnline, onQueued, onSuccess, onError]
  );

  return { execute, isExecuting, lastError };
}

// ─── Pre-built convenience hooks ──────────────────────────────────────────────
// Import these directly in your screens for the cleanest DX.

import { ACTION_TYPE } from "../constants/queueConfig";

/**
 * @param {{ isOnline: boolean, api: object }} options
 *
 * Example:
 *   const { execute, isExecuting } = usePestDetectionSubmit({ isOnline, api });
 *   await execute({ cropId, imageUrl, detectedPests, severity, detectedAt });
 */
export function usePestDetectionSubmit({ isOnline, api, onQueued, onSuccess, onError }) {
  return useQueuedAction({
    actionType:   ACTION_TYPE.PEST_DETECTION,
    onlineAction: api?.submitPestDetection ?? (() => Promise.resolve()),
    isOnline,
    onQueued,
    onSuccess,
    onError,
  });
}

/**
 * @param {{ isOnline: boolean, api: object }} options
 *
 * Example:
 *   const { execute } = useExpenseAdd({ isOnline, api });
 *   await execute({ farmId, category, amount, description, date });
 */
export function useExpenseAdd({ isOnline, api, onQueued, onSuccess, onError }) {
  return useQueuedAction({
    actionType:   ACTION_TYPE.EXPENSE_ADD,
    onlineAction: api?.addExpense ?? (() => Promise.resolve()),
    isOnline,
    onQueued,
    onSuccess,
    onError,
  });
}

/**
 * @param {{ isOnline: boolean, api: object }} options
 *
 * Example:
 *   const { execute } = usePostCreate({ isOnline, api });
 *   await execute({ authorName, content, category, imageUrls });
 */
export function usePostCreate({ isOnline, api, onQueued, onSuccess, onError }) {
  return useQueuedAction({
    actionType:   ACTION_TYPE.POST_CREATE,
    onlineAction: api?.createPost ?? (() => Promise.resolve()),
    isOnline,
    onQueued,
    onSuccess,
    onError,
  });
}

/**
 * @param {{ isOnline: boolean, api: object }} options
 *
 * Example:
 *   const { execute } = useListingCreate({ isOnline, api });
 *   await execute({ commodity, quantity, unit, pricePerUnit, location, availableFrom });
 */
export function useListingCreate({ isOnline, api, onQueued, onSuccess, onError }) {
  return useQueuedAction({
    actionType:   ACTION_TYPE.LISTING_CREATE,
    onlineAction: api?.createListing ?? (() => Promise.resolve()),
    isOnline,
    onQueued,
    onSuccess,
    onError,
  });
}
