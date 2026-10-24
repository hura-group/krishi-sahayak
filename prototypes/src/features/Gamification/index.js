/**
 * index.js — Barrel export for the Gamification feature module.
 *
 * ─── Quick reference ──────────────────────────────────────────────────────────
 *
 * Home screen — "Almost There" nudge:
 *   const { nudge, isDismissed, dismiss, recheckNudge } = useAlmostThere();
 *   {!isDismissed && nudge && <AlmostThereBanner nudge={nudge} onDismiss={dismiss} />}
 *
 * Profile screen — XP progress bar:
 *   const progress = useXPProgress();
 *   <XPProgressBar {...progress} />
 *
 * Community post — tier & Top Contributor badges:
 *   <TierBadge tier={authorTier} />
 *   <TopContributorBadge isChampion={authorIsChampion} />
 * =============================================================================
 */

// ── Components ────────────────────────────────────────────────────────────────
export { default as AlmostThereBanner } from "./components/AlmostThereBanner";
export { default as XPProgressBar }     from "./components/XPProgressBar";
export { default as TierBadge }         from "./components/Badges";
export { TopContributorBadge }          from "./components/Badges";

// ── Hooks ─────────────────────────────────────────────────────────────────────
export { useXPProgress }    from "./hooks/useXPProgress";
export { useAlmostThere }   from "./hooks/useAlmostThere";

// ── Utils ─────────────────────────────────────────────────────────────────────
export {
  getTierForXP,
  getNextTier,
  getXPToNextTier,
  getTierProgress,
  getOverallProgress,
  isChampion,
  formatXP,
  getNextTierLabel,
} from "./utils/tierUtils";

// ── Constants ─────────────────────────────────────────────────────────────────
export {
  TIERS,
  TIER_BY_ID,
  TIER_THRESHOLDS,
  ALMOST_THERE_RANK_XP_THRESHOLD,
  ALMOST_THERE_TIER_XP_THRESHOLD,
} from "./constants/tiers";
