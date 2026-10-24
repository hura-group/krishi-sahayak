/**
 * utils/badgeChecker.js
 *
 * Client-side utility that calls the award-badge Edge Function
 * after every relevant user action.
 *
 * Usage — call the appropriate wrapper right after the action succeeds:
 *
 *   // After a crop scan completes:
 *   import { onScanCompleted } from "@/features/Badges";
 *   await onScanCompleted();
 *
 *   // After a sale with price data:
 *   await onSaleCompleted({ salePrice: 2400, predictedPeak: 2500 });
 *
 * The function is fire-and-forget safe: it catches all errors internally
 * so a badge-check failure never breaks the user-facing action.
 */

import { supabase } from "@/lib/supabase"; // adjust to your Supabase client path

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Calls the award-badge Edge Function for a given action.
 * Returns an array of newly awarded badges (empty if none or on error).
 *
 * @param {string}                   action   - matches ACTION_TO_BADGES keys in the Edge Function
 * @param {Record<string, unknown>}  metadata - optional extra data (e.g. price info for sale_completed)
 * @returns {Promise<object[]>}
 */
export async function triggerBadgeCheck(action, metadata = {}) {
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return [];

    const { data, error } = await supabase.functions.invoke("award-badge", {
      body: { userId: user.id, action, metadata },
    });

    if (error) {
      console.error(`[BadgeChecker] Edge Function error (action: ${action}):`, error);
      return [];
    }

    return data?.awarded ?? [];
  } catch (err) {
    console.error(`[BadgeChecker] Unexpected error (action: ${action}):`, err);
    return [];
  }
}

// ─── Action wrappers ──────────────────────────────────────────────────────────
// One named export per user action — keeps call-sites clean and self-documenting.

/** Call after a successful crop scan */
export const onScanCompleted = () =>
  triggerBadgeCheck("scan");

/** Call after the market prices screen is viewed */
export const onMarketViewed = () =>
  triggerBadgeCheck("market_view");

/** Call after a community post is published */
export const onCommunityPosted = () =>
  triggerBadgeCheck("community_post");

/** Call after the daily login streak is incremented */
export const onLoginStreakUpdated = () =>
  triggerBadgeCheck("login_streak");

/** Call after a new product listing is created */
export const onProductListed = () =>
  triggerBadgeCheck("product_listed");

/** Call after a new user registration is confirmed */
export const onRegistrationCompleted = () =>
  triggerBadgeCheck("registration");

/** Call after an article or tip is fully read */
export const onArticleRead = () =>
  triggerBadgeCheck("article_read");

/** Call after the weather forecast screen is opened */
export const onWeatherChecked = () =>
  triggerBadgeCheck("weather_check");

/** Call after a harvest entry is saved */
export const onHarvestLogged = () =>
  triggerBadgeCheck("harvest_logged");

/**
 * Call after a sale is confirmed.
 * @param {{ salePrice: number, predictedPeak: number }} metadata
 */
export const onSaleCompleted = (metadata) =>
  triggerBadgeCheck("sale_completed", metadata);

/** Call after a new farmer connection is accepted */
export const onFarmerConnected = () =>
  triggerBadgeCheck("farmer_connected");

/** Call after a new crop is added to the user's profile */
export const onCropAdded = () =>
  triggerBadgeCheck("crop_added");

/** Call after the user saves profile changes */
export const onProfileUpdated = () =>
  triggerBadgeCheck("profile_updated");

/** Call after the user's XP is updated (e.g. post any action that grants XP) */
export const onXpUpdated = () =>
  triggerBadgeCheck("xp_milestone");

/** Call after the leaderboard rank is recalculated */
export const onLeaderboardRankUpdated = () =>
  triggerBadgeCheck("leaderboard_rank_updated");
