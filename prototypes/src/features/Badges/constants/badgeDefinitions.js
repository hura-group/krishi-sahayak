/**
 * constants/badgeDefinitions.js
 *
 * Single source of truth for all 15 achievement badge definitions.
 * These are mirrored in the `badges` DB table via the SQL migration seed.
 *
 * @typedef {{
 *   id:            string,
 *   name:          string,
 *   description:   string,
 *   icon:          string,
 *   color:         string,
 *   bgColor:       string,
 *   xpReward:      number,
 *   category:      "farming"|"social"|"market"|"learning"|"milestone",
 *   triggerAction: string,
 *   criteria:      string,
 * }} BadgeDefinition
 */

/** @type {BadgeDefinition[]} */
export const BADGE_DEFINITIONS = [
  {
    id:            "first-scan",
    name:          "First Scan",
    description:   "Scanned your first crop or product using the camera.",
    icon:          "ti-scan",
    color:         "#185FA5",
    bgColor:       "#DBEAFE",
    xpReward:      50,
    category:      "farming",
    triggerAction: "scan",
    criteria:      "Complete 1 crop scan",
  },
  {
    id:            "market-watcher",
    name:          "Market Watcher",
    description:   "Checked live market prices regularly to stay ahead.",
    icon:          "ti-chart-line",
    color:         "#534AB7",
    bgColor:       "#EDE9FE",
    xpReward:      75,
    category:      "market",
    triggerAction: "market_view",
    criteria:      "View market prices 10 times",
  },
  {
    id:            "community-champion",
    name:          "Community Champion",
    description:   "Actively shared knowledge and helped fellow farmers.",
    icon:          "ti-users",
    color:         "#0F6E56",
    bgColor:       "#D1FAE5",
    xpReward:      100,
    category:      "social",
    triggerAction: "community_post",
    criteria:      "Post 5 times in the community",
  },
  {
    id:            "green-streak",
    name:          "Green Streak",
    description:   "Kept the momentum alive — logged in 7 days in a row.",
    icon:          "ti-flame",
    color:         "#16A34A",
    bgColor:       "#DCFCE7",
    xpReward:      80,
    category:      "milestone",
    triggerAction: "login_streak",
    criteria:      "Maintain a 7-day login streak",
  },
  {
    id:            "top-seller",
    name:          "Top Seller",
    description:   "Listed your first product on the marketplace.",
    icon:          "ti-tag",
    color:         "#EA580C",
    bgColor:       "#FFEDD5",
    xpReward:      60,
    category:      "market",
    triggerAction: "product_listed",
    criteria:      "List 1 product for sale",
  },
  {
    id:            "early-bird",
    name:          "Early Bird",
    description:   "One of the first farmers to join the platform.",
    icon:          "ti-clock",
    color:         "#D97706",
    bgColor:       "#FEF3C7",
    xpReward:      200,
    category:      "milestone",
    triggerAction: "registration",
    criteria:      "Register within the first 30 days of launch",
  },
  {
    id:            "knowledge-seeker",
    name:          "Knowledge Seeker",
    description:   "Invested in learning — read 10 farming tips and articles.",
    icon:          "ti-book",
    color:         "#4338CA",
    bgColor:       "#E0E7FF",
    xpReward:      90,
    category:      "learning",
    triggerAction: "article_read",
    criteria:      "Read 10 articles or farming tips",
  },
  {
    id:            "weather-wise",
    name:          "Weather Wise",
    description:   "Used weather forecasts to plan your farming activities.",
    icon:          "ti-cloud",
    color:         "#0284C7",
    bgColor:       "#E0F2FE",
    xpReward:      50,
    category:      "farming",
    triggerAction: "weather_check",
    criteria:      "Check weather forecast 5 times",
  },
  {
    id:            "harvest-hero",
    name:          "Harvest Hero",
    description:   "Logged your very first harvest — the journey begins!",
    icon:          "ti-plant",
    color:         "#15803D",
    bgColor:       "#DCFCE7",
    xpReward:      100,
    category:      "farming",
    triggerAction: "harvest_logged",
    criteria:      "Log your first harvest",
  },
  {
    id:            "price-prophet",
    name:          "Price Prophet",
    description:   "Perfectly timed a sale at the predicted market high.",
    icon:          "ti-trending-up",
    color:         "#7C3AED",
    bgColor:       "#F3E8FF",
    xpReward:      150,
    category:      "market",
    triggerAction: "sale_completed",
    criteria:      "Sell within 10% of the predicted peak price",
  },
  {
    id:            "social-butterfly",
    name:          "Social Butterfly",
    description:   "Built a thriving network of 10 farmer connections.",
    icon:          "ti-heart-handshake",
    color:         "#DB2777",
    bgColor:       "#FCE7F3",
    xpReward:      120,
    category:      "social",
    triggerAction: "farmer_connected",
    criteria:      "Connect with 10 other farmers",
  },
  {
    id:            "crop-master",
    name:          "Crop Master",
    description:   "Diversified your farm by adding 5 different crop varieties.",
    icon:          "ti-leaf",
    color:         "#059669",
    bgColor:       "#D1FAE5",
    xpReward:      110,
    category:      "farming",
    triggerAction: "crop_added",
    criteria:      "Add 5 different crops to your profile",
  },
  {
    id:            "digital-farmer",
    name:          "Digital Farmer",
    description:   "Set up a complete profile — name, location, crops, and photo.",
    icon:          "ti-star",
    color:         "#1D4ED8",
    bgColor:       "#DBEAFE",
    xpReward:      75,
    category:      "milestone",
    triggerAction: "profile_updated",
    criteria:      "Complete your profile 100%",
  },
  {
    id:            "milestone-maker",
    name:          "Milestone Maker",
    description:   "Reached 1,000 XP — a true farming champion in the making.",
    icon:          "ti-trophy",
    color:         "#CA8A04",
    bgColor:       "#FEF9C3",
    xpReward:      200,
    category:      "milestone",
    triggerAction: "xp_milestone",
    criteria:      "Earn a total of 1,000 XP",
  },
  {
    id:            "legend",
    name:          "Legend",
    description:   "Claimed a spot in the Top 10 on the national leaderboard.",
    icon:          "ti-crown",
    color:         "#991B1B",
    bgColor:       "#FEE2E2",
    xpReward:      500,
    category:      "milestone",
    triggerAction: "leaderboard_rank_updated",
    criteria:      "Reach the Top 10 on the All India leaderboard",
  },
];

/** Quick O(1) lookup by badge id */
export const BADGE_BY_ID = Object.fromEntries(
  BADGE_DEFINITIONS.map((b) => [b.id, b])
);

/** All unique categories, "all" first */
export const BADGE_CATEGORIES = [
  "all",
  ...new Set(BADGE_DEFINITIONS.map((b) => b.category)),
];

/**
 * Maps each trigger action key → badge ids it could unlock.
 * Used by the Edge Function to know which badges to check
 * after a given user action fires.
 */
export const ACTION_TO_BADGE_IDS = BADGE_DEFINITIONS.reduce((acc, b) => {
  if (!acc[b.triggerAction]) acc[b.triggerAction] = [];
  acc[b.triggerAction].push(b.id);
  return acc;
}, {});
