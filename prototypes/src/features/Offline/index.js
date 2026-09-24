/**
 * src/features/Offline/index.js
 *
 * Barrel export for the Offline Indicator UI system.
 *
 * ─── Minimal integration (3 steps) ───────────────────────────────────────────
 *
 * 1. Mount once at your app root (e.g. app/layout.jsx or App.js):
 *
 *   import {
 *     useNetworkStatus,
 *     useOfflineSync,
 *     OfflineBanner,
 *     SyncToast,
 *   } from "@/features/Offline";
 *
 *   export default function RootLayout({ children }) {
 *     const { isOnline, isOffline, justCameOnline, connectionType } = useNetworkStatus();
 *     const { syncCount, isSyncing, syncedCount, addToQueue } = useOfflineSync({
 *       isOnline,
 *       onSync: async (items) => api.batchSync(items),
 *     });
 *
 *     return (
 *       <>
 *         <Header />
 *         <OfflineBanner isOffline={isOffline} connectionType={connectionType} />
 *         {children}
 *         <SyncToast
 *           isVisible={justCameOnline}
 *           syncCount={syncCount}
 *           isSyncing={isSyncing}
 *           syncedCount={syncedCount}
 *         />
 *       </>
 *     );
 *   }
 *
 * 2. Add CachedBadge to any data card section header:
 *
 *   import { CachedBadge } from "@/features/Offline";
 *   <CachedBadge cachedAt={lastFetchedAt} isOnline={isOnline} />
 *
 * 3. Replace empty/error states with RetryState:
 *
 *   import { RetryState } from "@/features/Offline";
 *   {fetchError && (
 *     <RetryState type="weather" isOffline={isOffline} onRetry={refetch} />
 *   )}
 */

// ── Components ────────────────────────────────────────────────────────────────
export { default as OfflineBanner }  from "./components/OfflineBanner";
export { default as CachedBadge }    from "./components/CachedBadge";
export { default as RetryState }     from "./components/RetryState";
export { default as SyncToast }      from "./components/SyncToast";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useNetworkStatus }          from "./hooks/useNetworkStatus";
export { useOfflineSync }            from "./hooks/useOfflineSync";

// ── Constants + utilities ─────────────────────────────────────────────────────
export {
  OFFLINE_CONFIG,
  OFFLINE_COLORS,
  formatCacheAge,
  isCacheStale,
}                                    from "./constants/offlineConfig";
