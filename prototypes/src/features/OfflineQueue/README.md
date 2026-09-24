# Offline Write Queue

WatermelonDB-backed offline write queue for KrishiSahayak.
Any write action taken while offline is queued locally and automatically
synced to Supabase when connectivity is restored.

---

## File structure

```
src/features/OfflineQueue/
├── index.js                          ← barrel — import everything from here
├── README.md
│
├── constants/
│   └── queueConfig.js                ← action types, statuses, priorities, labels
│
├── db/
│   └── schema.js                     ← WatermelonDB schema + Model + Database instance
│
├── processors/
│   └── actionProcessors.js           ← per-type Supabase upsert handlers
│
├── services/
│   └── queueService.js               ← enqueue(), processQueue(), getCounts()
│
├── hooks/
│   ├── useOfflineQueue.js            ← live queue state + auto-sync on reconnect
│   └── useQueuedAction.js            ← wraps any write with online/offline fallback
│
└── components/
    ├── SyncProgressToast.jsx         ← per-item animated progress toast
    └── QueueUI.jsx                   ← PendingSyncBadge + OfflineQueueSettingsSection
```

---

## Install dependencies

```bash
# WatermelonDB
npx expo install @nozbe/watermelondb

# Required peer dependencies
npx expo install @nozbe/with-observables

# UUID for client IDs
npm install uuid

# Babel plugin (React Native only)
# Add to babel.config.js → plugins: ["@nozbe/watermelondb/babel/plugin"]
```

For Expo / React Native, also install:
```bash
npx expo install @nozbe/watermelondb/adapters/sqlite
```

---

## Setup — 4 steps

### 1. Add schema to your existing WatermelonDB schema

```js
// src/db/schema.js
import { appSchema }                  from "@nozbe/watermelondb";
import { offlineQueueTableSchema }    from "@/features/OfflineQueue/db/schema";
import { myExistingTableSchema }      from "./mySchema";

export default appSchema({
  version: 2,                          // bump version when you add this table
  tables: [myExistingTableSchema, offlineQueueTableSchema],
});
```

### 2. Mount at root — provide context

```jsx
// App.js  or  app/_layout.jsx
import {
  useOfflineQueue,
  OfflineQueueContext,
  SyncProgressToast,
} from "@/features/OfflineQueue";
import { useNetworkStatus } from "@/features/Offline";
import { supabase }         from "@/lib/supabase";

export default function App() {
  const { isOnline, justCameOnline }  = useNetworkStatus();
  const { data: { user } }            = supabase.auth.useSession();

  const queue = useOfflineQueue({
    isOnline,
    supabase,
    userId: user?.id,
  });

  return (
    <OfflineQueueContext.Provider value={queue}>
      <RootNavigator />
      <SyncProgressToast
        progress={queue.progress}
        onDismiss={queue.resetProgress}
      />
    </OfflineQueueContext.Provider>
  );
}
```

### 3. Use in screens — one hook per action type

```jsx
// screens/PestDetectionScreen.jsx
import { usePestDetectionSubmit } from "@/features/OfflineQueue";

export default function PestDetectionScreen() {
  const { isOnline } = useNetworkStatus();
  const { execute, isExecuting } = usePestDetectionSubmit({
    isOnline,
    api: { submitPestDetection: api.submitPestDetection },
    onQueued: () => showToast("Saved offline — will upload when back online"),
    onSuccess: () => showToast("Pest report submitted!"),
  });

  const handleSubmit = async (formData) => {
    await execute({
      cropId:         formData.cropId,
      detectedPests:  formData.pests,
      severity:       formData.severity,
      detectedAt:     new Date().toISOString(),
    });
  };

  return (
    <Button onPress={handleSubmit} loading={isExecuting} label="Submit Report" />
  );
}
```

### 4. Add the Settings section

```jsx
// screens/SettingsScreen.jsx
import {
  PendingSyncBadge,
  OfflineQueueSettingsSection,
} from "@/features/OfflineQueue";

export default function SettingsScreen() {
  const { isOnline } = useNetworkStatus();

  return (
    <ScrollView>
      {/* Settings nav row with badge */}
      <SettingsRow
        icon="cloud_sync"
        label="Offline Sync"
        right={<PendingSyncBadge size="sm" />}
        onPress={() => navigation.navigate("OfflineQueueDetail")}
      />

      {/* Full queue section (auto-hides when empty) */}
      <OfflineQueueSettingsSection isOnline={isOnline} />
    </ScrollView>
  );
}
```

---

## Action types and payloads

### `pest_detection`
```js
{
  cropId:         string,       // required
  cropName?:      string,
  imageUrl?:      string,
  detectedPests:  string[],     // required
  severity:       "low"|"medium"|"high"|"critical",  // required
  detectedAt:     string,       // required (ISO 8601)
  latitude?:      number,
  longitude?:     number,
  notes?:         string,
}
```

### `expense_add`
```js
{
  farmId:       string,         // required
  category:     string,         // required
  amount:       number,         // required
  date:         string,         // required ("YYYY-MM-DD")
  description?: string,
  receiptUrl?:  string,
}
```

### `post_create`
```js
{
  authorName:  string,          // required
  content:     string,          // required
  category:    string,          // required
  createdAt?:  string,          // ISO 8601 (defaults to now)
  imageUrls?:  string[],
  location?:   string,
}
```

### `listing_create`
```js
{
  commodity:      string,       // required
  quantity:       number,       // required
  unit:           string,       // required (e.g. "quintal", "kg")
  pricePerUnit:   number,       // required
  location:       string,       // required
  availableFrom:  string,       // required ("YYYY-MM-DD")
  availableTo?:   string,
  description?:   string,
  imageUrls?:     string[],
}
```

---

## Conflict resolution

**Strategy: Last-Write-Wins (MVP)**

Every processor uses Supabase `upsert` with `onConflict: "client_id"`.
The `client_id` (UUID) is generated on the device when the action is taken.

- Same item queued twice (double-tap) → same `clientId` → one DB row → idempotent
- Item already synced from another device → overwritten with the queued values
- This is safe for MVP because all queued writes originate from a single user

To upgrade to server-side merge later, replace the `upsert` call in each
processor with a custom RPC that merges fields intelligently.

---

## Processing order

Items are processed in:
1. **Priority** (ascending): pest_detection → expense_add → post_create → listing_create
2. **Created at** (ascending): oldest first within each priority

Processing uses **exponential back-off** on failure:
- Attempt 1 fails → wait 2 s before attempt 2
- Attempt 2 fails → wait 4 s before attempt 3
- Attempt 3 fails → mark as FAILED, surface in Settings

---

## DB tables required (Supabase)

| Table | Key columns |
|---|---|
| `pest_detections` | `client_id` (UNIQUE), `user_id`, `crop_id`, `detected_pests`, `severity` |
| `farm_expenses` | `client_id` (UNIQUE), `user_id`, `farm_id`, `category`, `amount`, `expense_date` |
| `community_posts` | `client_id` (UNIQUE), `user_id`, `content`, `category` |
| `product_listings` | `client_id` (UNIQUE), `user_id`, `commodity`, `quantity`, `price_per_unit` |

Add a UNIQUE constraint on `client_id` for each table to enable idempotent upserts:
```sql
ALTER TABLE pest_detections   ADD CONSTRAINT pest_detections_client_id_unique   UNIQUE (client_id);
ALTER TABLE farm_expenses     ADD CONSTRAINT farm_expenses_client_id_unique     UNIQUE (client_id);
ALTER TABLE community_posts   ADD CONSTRAINT community_posts_client_id_unique   UNIQUE (client_id);
ALTER TABLE product_listings  ADD CONSTRAINT product_listings_client_id_unique  UNIQUE (client_id);
```

---

## Adding a new action type

1. Add to `ACTION_TYPE` in `constants/queueConfig.js`
2. Add priority to `ACTION_PRIORITY`
3. Add UI labels to `ACTION_LABELS`
4. Add processor to `actionProcessors.js`
5. Add convenience hook to `useQueuedAction.js`
6. Done — the queue service and UI pick it up automatically

---

## Run commands

```bash
# Unit tests (no DB)
npx vitest run src/features/OfflineQueue/__tests__/unit

# Integration (needs local Supabase)
SUPABASE_TEST_URL=http://localhost:54321 npx vitest run src/features/OfflineQueue/__tests__/integration
```
