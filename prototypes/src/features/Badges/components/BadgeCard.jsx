/**
 * components/BadgeCard.jsx
 *
 * Single badge card for the profile grid.
 *
 * Earned badge  → full colour, icon visible, earned date shown
 * Locked badge  → desaturated, lock overlay, criteria shown as hint
 *
 * @param {{ badge: EnrichedBadge }} props
 */

import React from "react";

const LOCK_STYLES = `
@keyframes badge-card-hover {
  to { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.10); }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("badge-card-styles")) return;
  const tag = document.createElement("style");
  tag.id        = "badge-card-styles";
  tag.innerHTML = LOCK_STYLES;
  document.head.appendChild(tag);
}

function BadgeCard({ badge }) {
  injectStyles();

  const { earned, earnedAt, icon, color, bgColor, name, description, xpReward, criteria } = badge;

  // Format earned date compactly: "12 Apr 2026"
  const earnedLabel = earnedAt
    ? earnedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div
      role="article"
      aria-label={`${name} badge — ${earned ? "earned" : "locked"}`}
      title={earned ? `Earned: ${earnedLabel}` : criteria}
      style={{
        position:       "relative",
        background:     earned ? "#fff" : "#fafafa",
        border:         `1px solid ${earned ? color + "33" : "rgba(0,0,0,0.08)"}`,
        borderRadius:   14,
        padding:        "16px 12px 14px",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        textAlign:      "center",
        gap:            8,
        cursor:         "default",
        transition:     "transform 0.18s ease, box-shadow 0.18s ease",
        filter:         earned ? "none" : "grayscale(0.7) opacity(0.7)",
        overflow:       "hidden",
      }}
    >
      {/* Earned glow accent at top */}
      {earned && (
        <div
          aria-hidden="true"
          style={{
            position:   "absolute",
            top: 0, left: 0, right: 0,
            height:     3,
            background: color,
            borderRadius: "14px 14px 0 0",
          }}
        />
      )}

      {/* Icon circle */}
      <div
        aria-hidden="true"
        style={{
          width:          48,
          height:         48,
          borderRadius:   "50%",
          background:     bgColor,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
          border:         earned ? `2px solid ${color}55` : "2px solid rgba(0,0,0,0.06)",
        }}
      >
        <i className={icon} style={{ fontSize: 22, color: earned ? color : "#aaa" }} />
      </div>

      {/* Name */}
      <span
        style={{
          fontSize:   12,
          fontWeight: 600,
          color:      earned ? "#111" : "#888",
          lineHeight: 1.3,
        }}
      >
        {name}
      </span>

      {/* Earned date or criteria hint */}
      <span
        style={{
          fontSize:   10,
          color:      earned ? color : "#aaa",
          lineHeight: 1.3,
          minHeight:  28,
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {earned ? earnedLabel : criteria}
      </span>

      {/* XP chip */}
      <span
        style={{
          fontSize:     10,
          fontWeight:   500,
          color:        earned ? "#854D0E" : "#bbb",
          background:   earned ? "#FEF9C3" : "#f0f0f0",
          padding:      "2px 8px",
          borderRadius: 8,
          border:       `1px solid ${earned ? "#FDE68A" : "transparent"}`,
        }}
      >
        +{xpReward} XP
      </span>

      {/* Lock icon overlay */}
      {!earned && (
        <div
          aria-hidden="true"
          style={{
            position:       "absolute",
            top:            8,
            right:          8,
            width:          18,
            height:         18,
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.08)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          <i className="ti ti-lock" style={{ fontSize: 10, color: "#aaa" }} />
        </div>
      )}

      {/* Earned checkmark */}
      {earned && (
        <div
          aria-hidden="true"
          style={{
            position:       "absolute",
            top:            8,
            right:          8,
            width:          18,
            height:         18,
            borderRadius:   "50%",
            background:     color,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          <i className="ti ti-check" style={{ fontSize: 10, color: "#fff" }} />
        </div>
      )}
    </div>
  );
}

export default BadgeCard;
