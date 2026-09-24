/**
 * utils/tierUtils.js
 *
 * Pure functions for all XP ↔ tier calculations.
 * No side-effects, no imports of React — safe to use anywhere.
 */

import { TIERS } from "../constants/tiers";

// ─── Tier resolution ──────────────────────────────────────────────────────────

/**
 * Returns the Tier object the given XP amount falls in.
 * @param {number} xp
 * @returns {import("../constants/tiers").Tier}
 */
export function getTierForXP(xp) {
  // Walk from top so we hit the right bucket quickly
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (xp >= TIERS[i].minXp) return TIERS[i];
  }
  return TIERS[0]; // fallback — XP can't be negative in practice
}

/**
 * Returns the next tier above the given one, or null if already at the top.
 * @param {import("../constants/tiers").Tier} tier
 * @returns {import("../constants/tiers").Tier|null}
 */
export function getNextTier(tier) {
  const idx = TIERS.findIndex((t) => t.id === tier.id);
  return idx >= 0 && idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

/**
 * Returns the tier index (0-based).
 * @param {import("../constants/tiers").Tier} tier
 * @returns {number}
 */
export function getTierIndex(tier) {
  return TIERS.findIndex((t) => t.id === tier.id);
}

// ─── Progress within tier ─────────────────────────────────────────────────────

/**
 * Returns the XP earned within the current tier (0 → tierRange).
 * @param {number} xp
 * @returns {number}
 */
export function getXPWithinTier(xp) {
  const tier = getTierForXP(xp);
  return xp - tier.minXp;
}

/**
 * Returns the total XP span of the current tier.
 * Returns Infinity for the top tier (Champion).
 * @param {number} xp
 * @returns {number}
 */
export function getTierSpan(xp) {
  const tier = getTierForXP(xp);
  if (tier.maxXp === Infinity) return Infinity;
  return tier.maxXp - tier.minXp + 1;
}

/**
 * Returns a 0–1 progress fraction within the current tier.
 * Champions are always 1.0 (complete).
 * @param {number} xp
 * @returns {number}
 */
export function getTierProgress(xp) {
  const tier = getTierForXP(xp);
  if (tier.maxXp === Infinity) return 1;
  const span = tier.maxXp - tier.minXp + 1;
  return Math.min((xp - tier.minXp) / span, 1);
}

/**
 * Returns XP still needed to reach the next tier, or 0 if at the top.
 * @param {number} xp
 * @returns {number}
 */
export function getXPToNextTier(xp) {
  const tier     = getTierForXP(xp);
  const nextTier = getNextTier(tier);
  if (!nextTier) return 0;
  return Math.max(nextTier.minXp - xp, 0);
}

// ─── Overall progress (across all tiers) ─────────────────────────────────────

/**
 * Returns an overall 0–1 progress fraction across the entire tier journey.
 * Uses the top of the last finite tier as the "100%" reference point so
 * Champions can still show meaningful progress.
 *
 * Scale: 0 XP = 0.0, 4,999 XP = 0.999, 5,000+ XP = 1.0
 * @param {number} xp
 * @returns {number}
 */
export function getOverallProgress(xp) {
  const MAX_SCALE_XP = 5000; // Champion entry threshold
  return Math.min(xp / MAX_SCALE_XP, 1);
}

// ─── Convenience checks ───────────────────────────────────────────────────────

/** @param {number} xp @returns {boolean} */
export const isSeedling  = (xp) => getTierForXP(xp).id === "seedling";
/** @param {number} xp @returns {boolean} */
export const isFarmer    = (xp) => getTierForXP(xp).id === "farmer";
/** @param {number} xp @returns {boolean} */
export const isExpert    = (xp) => getTierForXP(xp).id === "expert";
/** @param {number} xp @returns {boolean} */
export const isChampion  = (xp) => getTierForXP(xp).id === "champion";
/** @param {number} xp @returns {boolean} */
export const isTopTier   = (xp) => isChampion(xp);

// ─── Display helpers ──────────────────────────────────────────────────────────

/**
 * Formats XP as a compact string: 1340 → "1,340"
 * @param {number} xp
 * @returns {string}
 */
export const formatXP = (xp) =>
  new Intl.NumberFormat("en-IN").format(Math.floor(xp));

/**
 * Returns a human-readable description of how far the user is from the next tier.
 * e.g. "660 XP to Expert" | "You've reached Champion!"
 * @param {number} xp
 * @returns {string}
 */
export function getNextTierLabel(xp) {
  const tier     = getTierForXP(xp);
  const nextTier = getNextTier(tier);
  if (!nextTier) return "You've reached Champion! 👑";
  const gap = getXPToNextTier(xp);
  return `${formatXP(gap)} XP to ${nextTier.name}`;
}
