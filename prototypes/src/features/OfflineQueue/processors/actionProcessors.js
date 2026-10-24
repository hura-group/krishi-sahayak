/**
 * src/features/OfflineQueue/processors/actionProcessors.js
 *
 * One processor function per action type.
 * Each processor receives the deserialised payload and a Supabase admin client,
 * then performs the server-side write with last-write-wins conflict resolution.
 *
 * Conflict resolution strategy (MVP — last_write_wins):
 *   Every insert uses `upsert` with `onConflict: client_id`.
 *   The `client_id` column is a UUID generated on the device at write time.
 *   If the same item was already synced (e.g. from a different device or
 *   a previous retry), the server row is overwritten with the queued values.
 *   This is safe for MVP because all queued writes originate from a single user.
 *
 * @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient
 *
 * @typedef {{
 *   process:  (payload: object, supabase: SupabaseClient, userId: string) => Promise<void>,
 *   validate: (payload: object) => { valid: boolean, reason?: string },
 * }} Processor
 */

import { ACTION_TYPE } from "../constants/queueConfig";

// ─── Validation helpers ───────────────────────────────────────────────────────

const required = (obj, ...keys) => {
  const missing = keys.filter((k) => obj[k] == null || obj[k] === "");
  return missing.length === 0
    ? { valid: true }
    : { valid: false, reason: `Missing required fields: ${missing.join(", ")}` };
};

// ─── 1. Pest Detection ────────────────────────────────────────────────────────

/**
 * @type {Processor}
 * Payload shape:
 *   { clientId, cropId, cropName, imageUrl, detectedPests: string[],
 *     severity: "low"|"medium"|"high"|"critical",
 *     latitude?, longitude?, notes?, detectedAt: ISO string }
 */
const pestDetectionProcessor = {
  validate: (p) => required(p, "cropId", "detectedPests", "severity", "detectedAt"),

  process: async (payload, supabase, userId) => {
    const {
      clientId, cropId, cropName = "", imageUrl = null,
      detectedPests, severity, latitude = null, longitude = null,
      notes = "", detectedAt,
    } = payload;

    const { error } = await supabase
      .from("pest_detections")
      .upsert(
        {
          client_id:       clientId,
          user_id:         userId,
          crop_id:         cropId,
          crop_name:       cropName,
          image_url:       imageUrl,
          detected_pests:  detectedPests,      // text[] column
          severity,
          latitude,
          longitude,
          notes,
          detected_at:     detectedAt,
          synced_at:       new Date().toISOString(),
        },
        { onConflict: "client_id", ignoreDuplicates: false } // last-write-wins
      );

    if (error) throw new Error(`pest_detection sync failed: ${error.message}`);
  },
};

// ─── 2. Expense Add ───────────────────────────────────────────────────────────

/**
 * @type {Processor}
 * Payload shape:
 *   { clientId, farmId, category: string, amount: number,
 *     description: string, date: "YYYY-MM-DD", receiptUrl? }
 */
const expenseAddProcessor = {
  validate: (p) => required(p, "farmId", "category", "amount", "date"),

  process: async (payload, supabase, userId) => {
    const {
      clientId, farmId, category, amount, description = "",
      date, receiptUrl = null,
    } = payload;

    const { error } = await supabase
      .from("farm_expenses")
      .upsert(
        {
          client_id:   clientId,
          user_id:     userId,
          farm_id:     farmId,
          category,
          amount:      Number(amount),
          description,
          expense_date:date,
          receipt_url: receiptUrl,
          synced_at:   new Date().toISOString(),
        },
        { onConflict: "client_id", ignoreDuplicates: false }
      );

    if (error) throw new Error(`expense_add sync failed: ${error.message}`);
  },
};

// ─── 3. Post Create ───────────────────────────────────────────────────────────

/**
 * @type {Processor}
 * Payload shape:
 *   { clientId, authorName, content: string, category: string,
 *     imageUrls?: string[], location?: string, createdAt: ISO string }
 */
const postCreateProcessor = {
  validate: (p) => required(p, "content", "category", "authorName"),

  process: async (payload, supabase, userId) => {
    const {
      clientId, authorName, content, category,
      imageUrls = [], location = null, createdAt,
    } = payload;

    const { error } = await supabase
      .from("community_posts")
      .upsert(
        {
          client_id:    clientId,
          user_id:      userId,
          author_name:  authorName,
          content,
          category,
          image_urls:   imageUrls,
          location,
          created_at:   createdAt ?? new Date().toISOString(),
          synced_at:    new Date().toISOString(),
        },
        { onConflict: "client_id", ignoreDuplicates: false }
      );

    if (error) throw new Error(`post_create sync failed: ${error.message}`);
  },
};

// ─── 4. Listing Create ────────────────────────────────────────────────────────

/**
 * @type {Processor}
 * Payload shape:
 *   { clientId, commodity: string, quantity: number, unit: string,
 *     pricePerUnit: number, location: string, description?: string,
 *     availableFrom: "YYYY-MM-DD", availableTo?: "YYYY-MM-DD",
 *     imageUrls?: string[] }
 */
const listingCreateProcessor = {
  validate: (p) =>
    required(p, "commodity", "quantity", "unit", "pricePerUnit", "location", "availableFrom"),

  process: async (payload, supabase, userId) => {
    const {
      clientId, commodity, quantity, unit, pricePerUnit,
      location, description = "", availableFrom,
      availableTo = null, imageUrls = [],
    } = payload;

    const { error } = await supabase
      .from("product_listings")
      .upsert(
        {
          client_id:       clientId,
          user_id:         userId,
          commodity,
          quantity:        Number(quantity),
          unit,
          price_per_unit:  Number(pricePerUnit),
          location,
          description,
          available_from:  availableFrom,
          available_to:    availableTo,
          image_urls:      imageUrls,
          is_deleted:      false,
          synced_at:       new Date().toISOString(),
        },
        { onConflict: "client_id", ignoreDuplicates: false }
      );

    if (error) throw new Error(`listing_create sync failed: ${error.message}`);
  },
};

// ─── Processor registry ───────────────────────────────────────────────────────

/** @type {Record<string, Processor>} */
export const ACTION_PROCESSORS = {
  [ACTION_TYPE.PEST_DETECTION]: pestDetectionProcessor,
  [ACTION_TYPE.EXPENSE_ADD]:    expenseAddProcessor,
  [ACTION_TYPE.POST_CREATE]:    postCreateProcessor,
  [ACTION_TYPE.LISTING_CREATE]: listingCreateProcessor,
};

/**
 * Runs the correct processor for a queue item.
 *
 * @param {{ actionType: string, parsedPayload: object }} item
 * @param {SupabaseClient}  supabase
 * @param {string}          userId
 * @throws if the processor fails after the caller's retry logic
 */
export async function processQueueItem(item, supabase, userId) {
  const processor = ACTION_PROCESSORS[item.actionType];

  if (!processor) {
    throw new Error(`No processor registered for action type: "${item.actionType}"`);
  }

  // Validate payload before attempting network call
  const { valid, reason } = processor.validate(item.parsedPayload);
  if (!valid) {
    throw new Error(`Payload validation failed for ${item.actionType}: ${reason}`);
  }

  await processor.process(item.parsedPayload, supabase, userId);
}
