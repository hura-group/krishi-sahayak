/**
 * utils/formatters.js
 * Pure formatting helpers for the Leaderboard feature.
 */

/**
 * Format an XP integer for compact display.
 * @param {number} n
 * @returns {string}  e.g. 12450 → "12.4K" | 800 → "800"
 */
export const formatXP = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

/**
 * Extract up to two uppercase initials from a full name.
 * @param {string} name
 * @returns {string}  e.g. "Rajinder Singh" → "RS"
 */
export const getInitials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

/**
 * Deterministic avatar background colour derived from the farmer's name.
 * Uses a djb2-like hash so the same name always maps to the same colour
 * across renders and sessions.
 *
 * @param {string} name
 * @returns {string} CSS hex colour
 */
export const getAvatarColor = (name) => {
  const palette = [
    "#0F6E56", // deep green
    "#185FA5", // indigo
    "#854F0B", // amber-brown
    "#534AB7", // violet
    "#993556", // rose
    "#3B6D11", // olive
    "#993C1D", // terracotta
    "#0C447C", // navy
  ];
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0x7fffffff;
  return palette[hash % palette.length];
};
