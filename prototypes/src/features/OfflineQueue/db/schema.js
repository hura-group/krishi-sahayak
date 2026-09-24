/**
 * src/features/OfflineQueue/db/schema.js
 *
 * WatermelonDB schema for the offline_queue table.
 * Add this tableSchema into your root appSchema.
 */

import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const offlineQueueTableSchema = tableSchema({
  name: "offline_queue",
  columns: [
    // Action identity
    { name: "action_type",   type: "string"  },   // ACTION_TYPE constant
    { name: "payload",       type: "string"  },   // JSON-serialised action data
    { name: "client_id",     type: "string"  },   // UUID — idempotency key on server

    // Lifecycle
    { name: "status",        type: "string"  },   // QUEUE_STATUS constant
    { name: "priority",      type: "number"  },   // lower = processed first
    { name: "attempts",      type: "number"  },   // retry counter
    { name: "error",         type: "string",  isOptional: true },  // last error message

    // Timestamps (stored as Unix ms)
    { name: "created_at",    type: "number"  },
    { name: "processed_at",  type: "number",  isOptional: true },
  ],
});

/**
 * Minimal app schema — merge this with your existing appSchema if you already
 * have one. Example:
 *
 *   import { appSchema } from "@nozbe/watermelondb";
 *   import { offlineQueueTableSchema } from "@/features/OfflineQueue/db/schema";
 *   import { myOtherTableSchema } from "@/db/schema";
 *
 *   export default appSchema({
 *     version: 2,
 *     tables: [myOtherTableSchema, offlineQueueTableSchema],
 *   });
 */
export const queueAppSchema = appSchema({
  version: 1,
  tables: [offlineQueueTableSchema],
});


// =============================================================================
// src/features/OfflineQueue/db/OfflineQueueItem.js
// =============================================================================

/**
 * WatermelonDB Model for a single item in the offline write queue.
 *
 * @example
 * // Read all pending items
 * const pending = await database
 *   .get(OfflineQueueItem.table)
 *   .query(Q.where("status", "pending"))
 *   .fetch();
 */

import { Model }        from "@nozbe/watermelondb";
import { field, date, readonly, text, json } from "@nozbe/watermelondb/decorators";
import { QUEUE_STATUS, ACTION_PRIORITY, ACTION_TYPE } from "../constants/queueConfig";

export default class OfflineQueueItem extends Model {
  static table = "offline_queue";

  @text("action_type")   actionType;
  @text("payload")       _payload;       // raw JSON string — use parsedPayload
  @text("client_id")     clientId;
  @text("status")        status;
  @field("priority")     priority;
  @field("attempts")     attempts;
  @text("error")         error;
  @field("created_at")   createdAt;
  @field("processed_at") processedAt;

  /** Deserialised payload object */
  get parsedPayload() {
    try {
      return JSON.parse(this._payload);
    } catch {
      return {};
    }
  }

  /** True when this item is waiting to be sent */
  get isPending() {
    return this.status === QUEUE_STATUS.PENDING;
  }

  /** True when all retry attempts have been exhausted */
  get isFailed() {
    return this.status === QUEUE_STATUS.FAILED;
  }
}


// =============================================================================
// src/features/OfflineQueue/db/database.js
// =============================================================================

/**
 * WatermelonDB database instance for the Offline Queue feature.
 *
 * If your app already has a WatermelonDB instance, import it instead and
 * add `offlineQueueTableSchema` to your existing schema — do NOT create a
 * second Database instance.
 *
 * Adapter selection:
 *   - React Native (Expo)  → SQLiteAdapter (native SQLite)
 *   - Web / SSR            → LokiJSAdapter (in-memory, optional IndexedDB sync)
 */

import { Database }       from "@nozbe/watermelondb";
import OfflineQueueItem   from "./OfflineQueueItem";
import { queueAppSchema } from "./schema";

// ── React Native (Expo) adapter ───────────────────────────────────────────────
// Uncomment this block and comment-out the LokiJS block below when running
// on a real device or in Expo Go.
//
// import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
//
// const adapter = new SQLiteAdapter({
//   schema:       queueAppSchema,
//   dbName:       "KisanSathiOfflineQueue",
//   migrations:   undefined,     // add migrations when schema version bumps
//   jsi:          true,          // JSI improves performance on RN
//   onSetUpError: (error) => {
//     console.error("[OfflineQueue] SQLite setup error:", error);
//   },
// });

// ── Web / LokiJS adapter (default — works in Next.js and browsers) ────────────
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";

const adapter = new LokiJSAdapter({
  schema:     queueAppSchema,
  useWebWorker: false,
  useIncrementalIndexedDB: true,
  onSetUpError: (error) => {
    console.error("[OfflineQueue] LokiJS setup error:", error);
  },
});

/**
 * Singleton database instance.
 * Import `queueDatabase` wherever you need direct DB access.
 */
export const queueDatabase = new Database({
  adapter,
  modelClasses: [OfflineQueueItem],
});
