/**
 * src/features/OfflineQueue/index.js  — barrel export
 */

// Components
export { default as SyncProgressToast }          from "./components/SyncProgressToast";
export { PendingSyncBadge, OfflineQueueSettingsSection } from "./components/QueueUI";

// Hooks
export {
  useOfflineQueue,
  OfflineQueueContext,
  useOfflineQueueContext,
}                                                from "./hooks/useOfflineQueue";
export {
  useQueuedAction,
  usePestDetectionSubmit,
  useExpenseAdd,
  usePostCreate,
  useListingCreate,
}                                                from "./hooks/useQueuedAction";

// Services (for advanced use)
export {
  enqueue,
  processQueue,
  getCounts,
  getPendingItems,
  clearCompleted,
  resetFailed,
}                                                from "./services/queueService";

// DB (for advanced use / testing)
export { queueDatabase }                         from "./db/schema";
export { default as OfflineQueueItem }           from "./db/OfflineQueueItem";

// Processors
export { ACTION_PROCESSORS, processQueueItem }   from "./processors/actionProcessors";

// Constants
export {
  ACTION_TYPE,
  QUEUE_STATUS,
  ACTION_PRIORITY,
  QUEUE_CONFIG,
  ACTION_LABELS,
}                                                from "./constants/queueConfig";
