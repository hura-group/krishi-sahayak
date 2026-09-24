# Offline Indicator UI

Complete offline experience system for KrishiSahayak — banner, cached data badges,
actionable retry states, and a reconnection sync toast.

---

## File structure

```
src/features/Offline/
├── index.js                        ← barrel — import everything from here
├── README.md
├── KrishiSahayak-offline.html      ← enhanced standalone HTML (drop-in ready)
├── constants/
│   └── offlineConfig.js            ← thresholds, colors, formatCacheAge()
├── hooks/
│   ├── useNetworkStatus.js         ← navigator.onLine + events + ping poll
│   └── useOfflineSync.js           ← pending queue, auto-sync on reconnect
└── components/
    ├── OfflineBanner.jsx            ← red sticky top banner, slide animation
    ├── CachedBadge.jsx              ← "Cached X ago" / "Live" pill on cards
    ├── RetryState.jsx               ← actionable error state, back-off timer
    └── SyncToast.jsx                ← "Back online! Syncing…" slide-up toast
```

---

## Setup — 3 steps

### Step 1 — Mount at root (Next.js App Router)

```jsx
// app/layout.jsx
"use client";
import {
  useNetworkStatus, useOfflineSync,
  OfflineBanner, SyncToast,
} from "@/features/Offline";

export default function RootLayout({ children }) {
  const { isOnline, isOffline, justCameOnline, connectionType } = useNetworkStatus();
  const { syncCount, isSyncing, syncedCount, addToQueue } = useOfflineSync({
    isOnline,
    onSync: async (items) => await api.batchSync(items),
  });

  return (
    <html lang="en">
      <body>
        <Header />                                    {/* sticky top-0, h-16 */}
        <OfflineBanner
          isOffline={isOffline}
          connectionType={connectionType}
          topOffset="64px"                            {/* match your header height */}
        />
        <main>{children}</main>
        <SyncToast
          isVisible={justCameOnline}
          syncCount={syncCount}
          isSyncing={isSyncing}
          syncedCount={syncedCount}
          bottomOffset={96}                           {/* clears bottom nav */}
        />
      </body>
    </html>
  );
}
```

### Step 2 — Add CachedBadge to data section headers

```jsx
import { CachedBadge } from "@/features/Offline";

// In any section that shows fetched data:
<div className="flex items-center justify-between mb-3">
  <h2>Market Prices</h2>
  <CachedBadge cachedAt={marketData.fetchedAt} isOnline={isOnline} />
</div>
```

### Step 3 — Replace empty/error states with RetryState

```jsx
import { RetryState } from "@/features/Offline";

{fetchError ? (
  <RetryState
    type="weather"          // "weather" | "market" | "crop" | "generic"
    isOffline={isOffline}
    onRetry={refetchWeather}
  />
) : (
  <WeatherCard data={weatherData} />
)}
```

### Queueing offline actions

```js
const { addToQueue } = useOfflineSync({ isOnline, onSync: syncHandler });

// When user scans a crop while offline:
const handleScan = async (imageUri) => {
  if (!isOnline) {
    addToQueue("crop_scan", { imageUri, cropId, scannedAt: new Date() });
    showToast("Scan saved — will upload when back online");
    return;
  }
  await api.uploadScan(imageUri);
};
```

---

## Component reference

### `<OfflineBanner />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOffline` | boolean | false | Show the banner |
| `connectionType` | string | "unknown" | Shows "Slow 2G" warning if detected |
| `topOffset` | string | "64px" | CSS top value — match your header height |
| `message` | string | — | Override the default message |
| `onDismiss` | function | — | Called when user taps X |

- Slides down on `isOffline → true`, slides back up on `isOffline → false`
- Dismissed state resets automatically when connectivity returns

### `<CachedBadge />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `cachedAt` | Date\|string\|null | — | When data was last fetched |
| `isOnline` | boolean | true | Shows "Live" pill when true |

- Updates label every 60 s ("2 min ago" → "3 min ago")
- Turns amber when data is > 30 min old
- Turns red when data is very stale

### `<RetryState />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | string | "generic" | One of: `weather`, `market`, `crop`, `generic` |
| `isOffline` | boolean | false | Shows offline-specific copy when true |
| `onRetry` | async function | — | Called on each retry attempt |
| `title` | string | — | Override default title |
| `description` | string | — | Override default description |

- Exponential back-off: 1 s → 2 s → 4 s between attempts
- "Give up" state after 3 failed attempts with "Contact Support" link
- Shows attempt counter ("Attempt 2 of 3 failed")

### `<SyncToast />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `isVisible` | boolean | false | Trigger the toast |
| `syncCount` | number | 0 | Items in the queue |
| `isSyncing` | boolean | false | Show spinner |
| `syncedCount` | number | 0 | Items synced (for "done" message) |
| `onDismiss` | function | — | Called when dismissed |
| `bottomOffset` | number | 96 | px from bottom edge |

- Auto-dismisses 5 s after sync completes
- Transitions from "Syncing…" spinner → "All synced ✓" check icon

---

## useNetworkStatus

```js
const {
  isOnline,        // boolean — confirmed internet access
  isOffline,       // !isOnline
  justCameOnline,  // true for one render cycle after reconnect (triggers toast)
  connectionType,  // "4g" | "3g" | "2g" | "slow-2g" | "wifi" | "unknown"
  lastOnlineAt,    // Date of last confirmed connection
  checkNow,        // () => Promise<boolean> — manual ping
} = useNetworkStatus();
```

Connectivity is verified by:
1. `navigator.onLine` browser flag (immediate)
2. `online` / `offline` browser events (debounced 800 ms)
3. Lightweight HEAD ping to `/api/ping` every 10 s (detects captive portals)

### `/api/ping` endpoint (Next.js)

```js
// app/api/ping/route.js
export async function HEAD() {
  return new Response(null, { status: 204 });
}
```

## useOfflineSync

```js
const {
  queue,          // SyncQueueItem[] — all pending items
  syncCount,      // queue.length
  isSyncing,      // true while sync is in flight
  lastSyncAt,     // Date of last successful sync
  syncedCount,    // items synced in the last run
  addToQueue,     // (type: string, payload: unknown) => string (item id)
  removeFromQueue,// (id: string) => void
  syncNow,        // () => Promise<void> — manual trigger
} = useOfflineSync({ isOnline, onSync, onSyncDone });
```

- Queue persists across page refreshes via `localStorage`
- Auto-syncs 1.2 s after coming back online
- Best-effort: sync failures increment attempt count but don't remove items

---

## Standalone HTML

`KrishiSahayak-offline.html` is a self-contained file that requires no build step.
Open it directly in a browser to see all states.

Add `?demo` to the URL to get **Go Offline / Go Online** toggle buttons
(top-right corner) for manual testing.

```
file:///path/to/KrishiSahayak-offline.html?demo
```

---

## Design tokens used

Matches the KrishiSahayak Tailwind config:

| Token | Hex | Used for |
|---|---|---|
| `earth-red` / `#79564B` | Error/offline states |
| `primary` / `#003925` | Online states, success |
| `secondary` / `#2c694e` | Sync toast background |
| `error-container` / `#ffdad6` | RetryState background |
| `#B45309` (amber-700) | Stale cache badge |

---

## GitHub Actions — no extra setup needed

Unit tests for `formatCacheAge` and `isCacheStale` can be added to your
existing Vitest config. The hooks require `jsdom` environment (already set).

```js
// Example test
import { formatCacheAge, isCacheStale } from "@/features/Offline";

it("formats cache age correctly", () => {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  expect(formatCacheAge(twoHoursAgo)).toBe("Cached 2 hours ago");
  expect(isCacheStale(twoHoursAgo)).toBe(true);
});
```
