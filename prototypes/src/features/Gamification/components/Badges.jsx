/**
 * components/TierBadge.jsx
 *
 * Compact inline badge showing a user's current tier.
 * Used in leaderboard rows, community posts, and profile headers.
 *
 * Sizes:
 *   sm — icon + abbrev (e.g. "🌱")      → leaderboard row
 *   md — icon + name   (e.g. "Farmer")  → community post header (default)
 *   lg — icon + name + XP              → profile page
 *
 * @param {{
 *   tier: Tier,
 *   size?: "sm" | "md" | "lg",
 *   xp?:  number,   // required for size="lg"
 * }} props
 */

import React from "react";
import { formatXP } from "../utils/tierUtils";

function TierBadge({ tier, size = "md", xp }) {
  if (!tier) return null;

  const config = {
    sm: { padding: "2px 7px", fontSize: 10, iconSize: 11, showName: false },
    md: { padding: "3px 9px", fontSize: 11, iconSize: 12, showName: true  },
    lg: { padding: "5px 13px", fontSize: 13, iconSize: 14, showName: true  },
  }[size] ?? { padding: "3px 9px", fontSize: 11, iconSize: 12, showName: true };

  return (
    <span
      aria-label={`${tier.name} tier`}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          4,
        padding:      config.padding,
        background:   tier.bgColor,
        color:        tier.color,
        border:       `1px solid ${tier.color}44`,
        borderRadius: 20,
        fontSize:     config.fontSize,
        fontWeight:   600,
        flexShrink:   0,
        lineHeight:   1,
        whiteSpace:   "nowrap",
      }}
    >
      <i
        className={tier.icon}
        style={{ fontSize: config.iconSize }}
        aria-hidden="true"
      />
      {config.showName && tier.name}
      {size === "lg" && typeof xp === "number" && (
        <span style={{ fontWeight: 400, opacity: 0.8, marginLeft: 2 }}>
          · {formatXP(xp)} XP
        </span>
      )}
    </span>
  );
}

export default TierBadge;


// =============================================================================

/**
 * components/TopContributorBadge.jsx  (exported below)
 *
 * Exclusive gold badge shown next to Champion-tier users' names
 * in the community feed.
 *
 * Rules:
 *   • Only render when isChampion === true
 *   • Subtle gold shimmer animation — prestigious, not distracting
 *   • "Top Contributor" text + crown icon
 *
 * Usage in a community post header:
 *   <span>{authorName}</span>
 *   <TopContributorBadge isChampion={authorIsChampion} />
 *
 * @param {{ isChampion: boolean, size?: "sm"|"md" }} props
 */

const TC_CSS = `
@keyframes tc-shimmer {
  0%   { background-position: -300% 0; }
  100% { background-position:  300% 0; }
}
`;

function injectTC() {
  if (typeof document === "undefined") return;
  if (document.getElementById("tc-badge-styles")) return;
  const tag = document.createElement("style");
  tag.id = "tc-badge-styles";
  tag.innerHTML = TC_CSS;
  document.head.appendChild(tag);
}

export function TopContributorBadge({ isChampion, size = "md" }) {
  injectTC();
  if (!isChampion) return null;

  const isSm = size === "sm";

  return (
    <span
      aria-label="Top Contributor — Champion tier"
      style={{
        display:         "inline-flex",
        alignItems:      "center",
        gap:             isSm ? 3 : 4,
        padding:         isSm ? "2px 7px" : "3px 10px",
        borderRadius:    20,
        fontSize:        isSm ? 9 : 11,
        fontWeight:      700,
        color:           "#7C2D12",
        border:          "1px solid #FDE68A",
        letterSpacing:   "0.02em",
        whiteSpace:      "nowrap",
        flexShrink:      0,
        // Shimmer background
        background:      "linear-gradient(90deg, #FEF3C7 0%, #FDE68A 30%, #F59E0B 50%, #FDE68A 70%, #FEF3C7 100%)",
        backgroundSize:  "300% 100%",
        animation:       "tc-shimmer 3s ease-in-out infinite",
      }}
    >
      <i
        className="ti ti-crown"
        style={{ fontSize: isSm ? 10 : 12, color: "#D97706" }}
        aria-hidden="true"
      />
      Top Contributor
    </span>
  );
}
