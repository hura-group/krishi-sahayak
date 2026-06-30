/**
 * hooks/useLeaderboard.js
 *
 * Encapsulates all state and derived data for the leaderboard screen.
 * The main component stays a pure render layer; all logic lives here.
 *
 * @param {object}  options
 * @param {Array}   options.weeklyData
 * @param {Array}   options.monthlyData
 * @param {object}  options.currentUser
 * @returns {object} All values and setters the screen needs.
 */

import { useState, useMemo } from "react";
import {
  MOCK_WEEKLY_DATA,
  MOCK_MONTHLY_DATA,
  MOCK_CURRENT_USER,
} from "../data/mockLeaderboard";

// Swap this constant for a real API call / context value in production.
const PERIOD_LABELS = {
  weekly:  "May 6 – 12, 2026",
  monthly: "May 2026",
};

export function useLeaderboard({
  weeklyData  = MOCK_WEEKLY_DATA,
  monthlyData = MOCK_MONTHLY_DATA,
  currentUser = MOCK_CURRENT_USER,
} = {}) {
  const [tab,         setTab]         = useState("weekly");
  const [stateFilter, setStateFilter] = useState("All India");

  // Raw dataset for the active tab
  const rawData = tab === "weekly" ? weeklyData : monthlyData;

  /**
   * Filtered list capped at 50.
   * Keeps re-render work minimal — only recomputes when tab or filter changes.
   */
  const top50 = useMemo(() => {
    const data =
      stateFilter === "All India"
        ? rawData
        : rawData.filter((f) => f.state === stateFilter);
    return data.slice(0, 50);
  }, [rawData, stateFilter]);

  // Rank-1 XP used to size the relative progress bars
  const maxXp = top50[0]?.xp ?? 1;

  // Current user stats for the active tab
  const cuStats = currentUser[tab]; // { xp, streak, rank }

  /**
   * Show the current-user row whenever the state filter matches their state
   * or no filter is applied.
   */
  const showCurrentUser =
    stateFilter === "All India" || stateFilter === currentUser.state;

  /**
   * XP the user still needs to enter the top 50.
   * null  → fewer than 50 farmers in the filtered list (user is already "in")
   * <= 0  → user already qualifies
   * > 0   → XP gap to show
   */
  const xpGap =
    top50.length >= 50 ? top50[49].xp - cuStats.xp : null;

  const periodLabel = PERIOD_LABELS[tab];

  return {
    // Tab
    tab,
    setTab,
    // State filter
    stateFilter,
    setStateFilter,
    // Data
    top50,
    maxXp,
    // Current user
    currentUser,
    cuStats,
    showCurrentUser,
    xpGap,
    // Display
    periodLabel,
  };
}
