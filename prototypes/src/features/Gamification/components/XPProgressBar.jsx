/**
 * components/XPProgressBar.jsx
 *
 * Full XP tier progress bar for the profile screen.
 *
 * Visual layout:
 *
 *   Tier Journey
 *   🌱 ──────────── 🚜 ──────────── ⭐ ──────────── 👑
 *   Seedling        Farmer          Expert          Champion
 *                    ↑ YOU (animated fill up to here)
 *
 *   [████████████████████████████░░░░░░░░░]
 *    0                         2,450 XP           5,000
 *
 *      1,550 XP to Expert
 *
 *   Your {Farmer} tier benefits:
 *     ✓ Advanced market analytics
 *     ✓ 2× post reach …
 *
 * @param {{
 *   xp:            number,
 *   tier:          Tier,
 *   nextTier:      Tier|null,
 *   xpWithinTier:  number,
 *   xpToNextTier:  number,
 *   tierProgress:  number,    // 0–1 within current tier
 *   overallProgress: number,  // 0–1 across all tiers
 *   isLoading?:    boolean,
 * }} props
 */

import React, { useEffect, useRef } from "react";
import { TIERS } from "../constants/tiers";
import { formatXP, getNextTierLabel } from "../utils/tierUtils";

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
@keyframes xpb-fill {
  from { width: 0%; }
}
@keyframes xpb-node-pop {
  0%   { transform: scale(0.6); opacity: 0; }
  70%  { transform: scale(1.15); }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes xpb-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
@keyframes xpb-glow {
  0%,100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
  50%      { box-shadow: 0 0 0 6px rgba(0,0,0,0); }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("xpb-styles")) return;
  const tag = document.createElement("style");
  tag.id = "xpb-styles";
  tag.innerHTML = CSS;
  document.head.appendChild(tag);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonBar() {
  return (
    <div
      aria-hidden="true"
      style={{
        height:         120,
        borderRadius:   14,
        background:     "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation:      "xpb-shimmer 1.4s ease infinite",
      }}
    />
  );
}

function TierNode({ tier, isActive, isPast, overallPct, totalTiers, index }) {
  const nodePct    = index === 0 ? 0 : (index / (totalTiers - 1)) * 100;
  const isUnlocked = isPast || isActive;

  return (
    <div
      style={{
        position:  "absolute",
        left:      `${nodePct}%`,
        top:       "50%",
        transform: "translate(-50%, -50%)",
        display:   "flex",
        flexDirection: "column",
        alignItems: "center",
        gap:        4,
        zIndex:     2,
      }}
    >
      {/* Node circle */}
      <div
        aria-label={`${tier.name} tier${isActive ? " — current" : ""}`}
        style={{
          width:          isActive ? 36 : 28,
          height:         isActive ? 36 : 28,
          borderRadius:   "50%",
          background:     isUnlocked ? tier.bgColor : "#F3F4F6",
          border:         `2px solid ${isUnlocked ? tier.color : "#E5E7EB"}`,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          transition:     "all 0.3s ease",
          animation:      isActive ? "xpb-glow 2s ease-in-out infinite" : "none",
          boxShadow:      isActive ? `0 0 0 4px ${tier.color}22` : "none",
        }}
      >
        <i
          className={tier.icon}
          style={{
            fontSize: isActive ? 17 : 13,
            color:    isUnlocked ? tier.color : "#D1D5DB",
          }}
          aria-hidden="true"
        />
      </div>

      {/* Label below */}
      <span
        style={{
          fontSize:   10,
          fontWeight: isActive ? 600 : 400,
          color:      isActive ? tier.color : isUnlocked ? "#6B7280" : "#D1D5DB",
          whiteSpace: "nowrap",
          marginTop:  isActive ? 4 : 2,
        }}
      >
        {tier.name}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function XPProgressBar({
  xp,
  tier,
  nextTier,
  xpWithinTier,
  xpToNextTier,
  tierProgress,
  overallProgress,
  isLoading = false,
}) {
  injectStyles();
  const fillRef = useRef(null);
  const isChampion = !nextTier;

  // Animate fill width after mount
  useEffect(() => {
    if (!fillRef.current) return;
    fillRef.current.style.width = `${overallProgress * 100}%`;
  }, [overallProgress]);

  if (isLoading) return <SkeletonBar />;

  return (
    <div
      style={{
        fontFamily: "var(--font-sans, system-ui, sans-serif)",
        padding:    "18px 16px",
        background: "#fff",
        borderRadius: 16,
        border:     "0.5px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* ── Section title ── */}
      <div
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          8,
          marginBottom: 20,
        }}
      >
        <i className="ti ti-chart-bar" style={{ fontSize: 17, color: "#6B7280" }} aria-hidden="true" />
        <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
          Tier Progress
        </span>
        {/* Current tier chip */}
        <span
          style={{
            marginLeft:   "auto",
            display:      "inline-flex",
            alignItems:   "center",
            gap:          5,
            fontSize:     12,
            fontWeight:   600,
            color:        tier.color,
            background:   tier.bgColor,
            padding:      "3px 10px",
            borderRadius: 20,
            border:       `1px solid ${tier.color}44`,
          }}
        >
          <i className={tier.icon} style={{ fontSize: 12 }} aria-hidden="true" />
          {tier.name}
        </span>
      </div>

      {/* ── Tier node track ── */}
      <div
        role="presentation"
        style={{
          position:      "relative",
          height:        64,
          marginBottom:  12,
          padding:       "0 14px",
        }}
      >
        {/* Track background */}
        <div
          style={{
            position:     "absolute",
            top:          "50%",
            left:         14,
            right:        14,
            height:       4,
            borderRadius: 2,
            background:   "#F3F4F6",
            transform:    "translateY(-50%)",
          }}
        />
        {/* Track fill */}
        <div
          ref={fillRef}
          style={{
            position:     "absolute",
            top:          "50%",
            left:         14,
            width:        0,               // animated via useEffect
            height:       4,
            borderRadius: 2,
            background:   tier.gradient,
            transform:    "translateY(-50%)",
            transition:   "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            maxWidth:     "calc(100% - 28px)",
          }}
          aria-hidden="true"
        />

        {/* Tier nodes */}
        {TIERS.map((t, idx) => {
          const tierIdx  = TIERS.findIndex((x) => x.id === tier.id);
          const isPast   = idx < tierIdx;
          const isActive = idx === tierIdx;
          return (
            <TierNode
              key={t.id}
              tier={t}
              isActive={isActive}
              isPast={isPast}
              overallPct={overallProgress * 100}
              totalTiers={TIERS.length}
              index={idx}
            />
          );
        })}
      </div>

      {/* ── XP numbers row ── */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          fontSize:       10,
          color:          "#9CA3AF",
          padding:        "0 2px",
          marginBottom:   14,
        }}
        aria-hidden="true"
      >
        <span>0</span>
        <span>500</span>
        <span>2,000</span>
        <span>5,000+</span>
      </div>

      {/* ── Progress bar within current tier ── */}
      {!isChampion && (
        <>
          <div
            role="progressbar"
            aria-valuenow={Math.round(tierProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(tierProgress * 100)}% through ${tier.name} tier`}
            style={{
              height:       8,
              borderRadius: 4,
              background:   "#F3F4F6",
              overflow:     "hidden",
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width:        `${tierProgress * 100}%`,
                height:       "100%",
                borderRadius: 4,
                background:   nextTier ? nextTier.gradient : tier.gradient,
                transition:   "width 1s ease",
              }}
            />
          </div>
          <div
            style={{
              display:        "flex",
              justifyContent: "space-between",
              fontSize:       11,
              color:          "#6B7280",
              marginBottom:   16,
            }}
          >
            <span>
              <strong style={{ color: tier.color }}>{formatXP(xp)}</strong> XP
            </span>
            <span style={{ color: nextTier?.color }}>
              {formatXP(xpToNextTier)} XP to {nextTier?.name}
            </span>
          </div>
        </>
      )}

      {/* Champion — max tier celebration */}
      {isChampion && (
        <div
          style={{
            textAlign:    "center",
            padding:      "10px 0 6px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          7,
              fontSize:     13,
              fontWeight:   600,
              color:        tier.color,
              background:   tier.bgColor,
              padding:      "6px 16px",
              borderRadius: 20,
              border:       `1px solid ${tier.color}44`,
            }}
          >
            <i className="ti ti-crown" style={{ fontSize: 14 }} aria-hidden="true" />
            {formatXP(xp)} XP — Champion
          </div>
        </div>
      )}

      {/* ── Tier benefits ── */}
      <div
        style={{
          background:   tier.bgColor,
          borderRadius: 12,
          padding:      "12px 14px",
          border:       `1px solid ${tier.color}22`,
        }}
      >
        <div
          style={{
            fontSize:     12,
            fontWeight:   600,
            color:        tier.color,
            marginBottom: 8,
          }}
        >
          <i className={tier.icon} style={{ marginRight: 5, fontSize: 12 }} aria-hidden="true" />
          {tier.name} Benefits
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {tier.benefits.map((b, i) => (
            <li
              key={i}
              style={{
                display:    "flex",
                alignItems: "flex-start",
                gap:        7,
                fontSize:   12,
                color:      "#374151",
                lineHeight: 1.5,
                marginBottom: i < tier.benefits.length - 1 ? 4 : 0,
              }}
            >
              <i
                className="ti ti-circle-check-filled"
                style={{ fontSize: 13, color: tier.color, flexShrink: 0, marginTop: 1 }}
                aria-hidden="true"
              />
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* Next tier teaser */}
      {nextTier && (
        <div
          style={{
            marginTop:  12,
            fontSize:   11,
            color:      "#9CA3AF",
            textAlign:  "center",
          }}
        >
          <i className="ti ti-lock" style={{ fontSize: 11, marginRight: 3 }} aria-hidden="true" />
          Reach {nextTier.name} to unlock{" "}
          <span style={{ color: nextTier.color, fontWeight: 500 }}>
            {nextTier.benefits[nextTier.benefits.length - 1].toLowerCase()}
          </span>
        </div>
      )}
    </div>
  );
}

export default XPProgressBar;
