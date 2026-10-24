/**
 * index.js — Barrel export for the Badges feature module.
 *
 * ─── Quick usage ──────────────────────────────────────────────────────────────
 *
 * 1. Show the badge grid in ProfileScreen:
 *      import { BadgeGrid, useBadges } from "@/features/Badges";
 *      const { badges, earnedCount, isLoading, error } = useBadges();
 *      <BadgeGrid badges={badges} earnedCount={earnedCount} isLoading={isLoading} />
 *
 * 2. Celebrate new badges anywhere in the app (mount once at root):
 *      import { BadgeEarnedModal, useBadgeNotification } from "@/features/Badges";
 *      const { pendingBadge, dismissBadge } = useBadgeNotification();
 *      {pendingBadge && <BadgeEarnedModal badge={pendingBadge} onDismiss={dismissBadge} />}
 *
 * 3. Trigger checks after user actions:
 *      import { onScanCompleted, onMarketViewed } from "@/features/Badges";
 *      await onScanCompleted();
 * =============================================================================
 */

// ── Components ────────────────────────────────────────────────────────────────
export { default as BadgeGrid }         from "./components/BadgeGrid";
export { default as BadgeCard }         from "./components/BadgeCard";
export { default as BadgeEarnedModal }  from "./components/BadgeEarnedModal";
export { default as ConfettiOverlay }   from "./components/ConfettiOverlay";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useBadges }              from "./hooks/useBadges";
export { useBadgeNotification }   from "./hooks/useBadgeNotification";

// ── Badge checker — call these after user actions ─────────────────────────────
export {
  triggerBadgeCheck,
  onScanCompleted,
  onMarketViewed,
  onCommunityPosted,
  onLoginStreakUpdated,
  onProductListed,
  onRegistrationCompleted,
  onArticleRead,
  onWeatherChecked,
  onHarvestLogged,
  onSaleCompleted,
  onFarmerConnected,
  onCropAdded,
  onProfileUpdated,
  onXpUpdated,
  onLeaderboardRankUpdated,
} from "./utils/badgeChecker";

// ── Constants ─────────────────────────────────────────────────────────────────
export {
  BADGE_DEFINITIONS,
  BADGE_BY_ID,
  BADGE_CATEGORIES,
  ACTION_TO_BADGE_IDS,
} from "./constants/badgeDefinitions";
