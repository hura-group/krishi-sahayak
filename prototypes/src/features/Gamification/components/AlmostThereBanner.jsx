/**
 * components/AlmostThereBanner.jsx
 *
 * Home-screen sticky nudge banner.
 *
 * Shown when the user is:
 *   • ≤ 10 XP behind the person ranked one above them  (type: "rank")
 *   • ≤ 50 XP away from the next XP tier               (type: "tier")
 *
 * Features:
 *   • Animated slide-down entry
 *   • XP number pulsing in accent colour
 *   • "Earn XP" CTA button (calls optional onEarnXP prop)
 *   • Dismissible (stores 24 h suppression in localStorage)
 *   • Accessible: role="alert" + aria-live
 *
 * Usage (mount in HomeScreen):
 *   const { nudge, isDismissed, dismiss } = useAlmostThere();
 *   {!isDismissed && nudge && (
 *     <AlmostThereBanner nudge={nudge} onDismiss={dismiss} onEarnXP={() => nav("tasks")} />
 *   )}
 *
 * @param {{
 *   nudge:      { type: "rank"|"tier", xpNeeded: number, targetLabel: string },
 *   onDismiss:  () => void,
 *   onEarnXP?:  () => void,
 * }} props
 */

import React, { useEffect, useRef } from "react";
import { TIER_BY_ID } from "../constants/tiers";

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
@keyframes atb-slide-in {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes atb-xp-pulse {
  0%,100% { transform: scale(1);    opacity: 1; }
  50%      { transform: scale(1.12); opacity: 0.85; }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("atb-styles")) return;
  const tag = document.createElement("style");
  tag.id = "atb-styles";
  tag.innerHTML = CSS;
  document.head.appendChild(tag);
}

// ─── Config per nudge type ────────────────────────────────────────────────────

function getNudgeConfig(nudge) {
  if (nudge.type === "rank") {
    return {
      icon:       "ti-trophy",
      color:      "#D97706",
      bgColor:    "#FFFBEB",
      borderColor:"#FDE68A",
      label:      "Almost there!",
      message:    `Just`,
      suffix:     `more XP to reach ${nudge.targetLabel}`,
      ctaLabel:   "Earn XP now",
    };
  }
  // type === "tier"
  const nextTier = nudge.nextTier ?? TIER_BY_ID[nudge.targetLabel?.toLowerCase()] ?? {};
  return {
    icon:       nextTier.icon ?? "ti-star",
    color:      nextTier.color ?? "#185FA5",
    bgColor:    nextTier.bgColor ?? "#DBEAFE",
    borderColor:(nextTier.color ?? "#185FA5") + "44",
    label:      "Level up incoming!",
    message:    `Only`,
    suffix:     `XP to reach ${nudge.targetLabel}`,
    ctaLabel:   "Keep going",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

function AlmostThereBanner({ nudge, onDismiss, onEarnXP }) {
  injectStyles();
  const bannerRef = useRef(null);

  // Focus the banner for screen-reader announcement
  useEffect(() => {
    bannerRef.current?.focus();
  }, [nudge]);

  if (!nudge) return null;

  const cfg = getNudgeConfig(nudge);

  return (
    <div
      ref={bannerRef}
      role="alert"
      aria-live="polite"
      tabIndex={-1}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          10,
        padding:      "11px 14px",
        background:   cfg.bgColor,
        border:       `1px solid ${cfg.borderColor}`,
        borderRadius: 14,
        margin:       "0 0 12px",
        animation:    "atb-slide-in 0.35s cubic-bezier(0.34,1.3,0.64,1) forwards",
        boxShadow:    "0 2px 12px rgba(0,0,0,0.06)",
        outline:      "none",
        position:     "relative",
      }}
    >
      {/* Left icon */}
      <div
        aria-hidden="true"
        style={{
          width:          38,
          height:         38,
          borderRadius:   "50%",
          background:     cfg.color + "22",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}
      >
        <i className={cfg.icon} style={{ fontSize: 18, color: cfg.color }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize:   12,
            fontWeight: 600,
            color:      cfg.color,
            marginBottom: 2,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {cfg.label}
        </div>
        <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.4 }}>
          {cfg.message}{" "}
          <span
            aria-label={`${nudge.xpNeeded} XP`}
            style={{
              fontWeight: 700,
              color:      cfg.color,
              animation:  "atb-xp-pulse 2s ease-in-out infinite",
              display:    "inline-block",
            }}
          >
            {nudge.xpNeeded} XP
          </span>{" "}
          {cfg.suffix}
        </div>
      </div>

      {/* CTA button */}
      {onEarnXP && (
        <button
          onClick={onEarnXP}
          style={{
            flexShrink:   0,
            padding:      "6px 14px",
            background:   cfg.color,
            color:        "#fff",
            border:       "none",
            borderRadius: 20,
            fontSize:     12,
            fontWeight:   500,
            cursor:       "pointer",
            whiteSpace:   "nowrap",
          }}
        >
          {cfg.ctaLabel}
        </button>
      )}

      {/* Dismiss × */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          position:   "absolute",
          top:        7,
          right:      8,
          background: "none",
          border:     "none",
          cursor:     "pointer",
          padding:    2,
          lineHeight: 1,
          color:      "#9CA3AF",
        }}
      >
        <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
      </button>
    </div>
  );
}

export default AlmostThereBanner;
