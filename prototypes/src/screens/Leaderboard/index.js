/**
 * index.js — Barrel export for the Leaderboard feature module.
 *
 * Import the screen:
 *   import LeaderboardScreen from "@/screens/Leaderboard";
 *
 * Import sub-pieces if you need them individually:
 *   import { useLeaderboard, MOCK_WEEKLY_DATA, formatXP } from "@/screens/Leaderboard";
 */

// Screen (default)
export { default } from "./LeaderboardScreen";
export { default as LeaderboardScreen } from "./LeaderboardScreen";

// Hook
export { useLeaderboard } from "./hooks/useLeaderboard";

// Sub-components (re-export for consumers who want to customise)
export { default as RankBadge }          from "./components/RankBadge";
export { default as Avatar }             from "./components/Avatar";
export { default as StateBadge }         from "./components/StateBadge";
export { default as FarmerRow }          from "./components/FarmerRow";
export { default as CurrentUserBanner }  from "./components/CurrentUserBanner";

// Constants
export { INDIAN_STATES, STATE_CODES } from "./constants/states";

// Mock data (useful for Storybook / tests)
export {
  MOCK_WEEKLY_DATA,
  MOCK_MONTHLY_DATA,
  MOCK_CURRENT_USER,
} from "./data/mockLeaderboard";

// Utilities
export { formatXP, getInitials, getAvatarColor } from "./utils/formatters";
