/**
 * constants/tiers.js
 *
 * Single source of truth for all XP tier definitions.
 * Used by tierUtils, XPProgressBar, TierBadge, and the Edge Function.
 *
 * Tier journey:  Seedling (0) → Farmer (500) → Expert (2000) → Champion (5000+)
 *
 * @typedef {{
 *   id:          string,
 *   name:        string,
 *   minXp:       number,
 *   maxXp:       number,       // Infinity for the top tier
 *   icon:        string,       // Tabler icon class
 *   color:       string,       // hex accent
 *   bgColor:     string,       // hex background
 *   gradient:    string,       // CSS gradient for progress bar fill
 *   tagline:     string,       // one-line motivational line
 *   benefits:    string[],     // visible perks in profile
 *   communityRole: string|null // label shown next to name in community
 * }} Tier
 */

/** @type {Tier[]} Ordered from lowest to highest */
export const TIERS = [
  {
    id:           "seedling",
    name:         "Seedling",
    minXp:        0,
    maxXp:        499,
    icon:         "ti-plant-2",
    color:        "#16A34A",
    bgColor:      "#DCFCE7",
    gradient:     "linear-gradient(90deg, #16A34A, #22C55E)",
    tagline:      "Every harvest starts with a single seed.",
    benefits: [
      "Full access to crop scanning",
      "Community read & post access",
      "Standard market price feed",
      "Daily weather forecast",
    ],
    communityRole: null,
  },
  {
    id:           "farmer",
    name:         "Farmer",
    minXp:        500,
    maxXp:        1999,
    icon:         "ti-tractor",
    color:        "#D97706",
    bgColor:      "#FEF3C7",
    gradient:     "linear-gradient(90deg, #D97706, #F59E0B)",
    tagline:      "Experience is the best teacher in the field.",
    benefits: [
      "Everything in Seedling",
      "Advanced market analytics (7-day trend)",
      "2× post reach in community",
      "Priority weather alerts via push",
      "Farmer tier badge on profile",
    ],
    communityRole: "Farmer",
  },
  {
    id:           "expert",
    name:         "Expert",
    minXp:        2000,
    maxXp:        4999,
    icon:         "ti-award",
    color:        "#185FA5",
    bgColor:      "#DBEAFE",
    gradient:     "linear-gradient(90deg, #185FA5, #3B82F6)",
    tagline:      "Your knowledge feeds more than just your farm.",
    benefits: [
      "Everything in Farmer",
      "Expert badge visible in all community posts",
      "Access to exclusive expert webinars",
      "Early access to new features",
      "Priority in-app support response",
    ],
    communityRole: "Expert",
  },
  {
    id:           "champion",
    name:         "Champion",
    minXp:        5000,
    maxXp:        Infinity,
    icon:         "ti-crown",
    color:        "#991B1B",
    bgColor:      "#FEE2E2",
    gradient:     "linear-gradient(90deg, #991B1B, #DC2626, #EF4444)",
    tagline:      "A champion lifts others as they climb.",
    benefits: [
      "Everything in Expert",
      "\"Top Contributor\" gold badge in community",
      "Featured on Home screen Spotlight",
      "Exclusive Champion-only content & insights",
      "Direct line to our agri-expert advisory team",
    ],
    communityRole: "Top Contributor",
  },
];

/** Total number of tiers */
export const TIER_COUNT = TIERS.length;

/** Quick O(1) lookup: tier id → Tier object */
export const TIER_BY_ID = Object.fromEntries(TIERS.map((t) => [t.id, t]));

/**
 * XP thresholds where a new tier begins.
 * [500, 2000, 5000] — used for progress bar milestone markers.
 */
export const TIER_THRESHOLDS = TIERS.slice(1).map((t) => t.minXp);

/** The threshold used for the "Almost There" rank nudge banner */
export const ALMOST_THERE_RANK_XP_THRESHOLD = 10;

/** The threshold used for the "Almost There" tier nudge banner */
export const ALMOST_THERE_TIER_XP_THRESHOLD = 50;
