/**
 * src/features/Offline/components/CachedBadge.jsx
 *
 * Compact badge shown on data cards to communicate cache freshness.
 *
 * Visual states:
 *   FRESH   (< 30 min + online)  → grey text "Live"  with green dot
 *   CACHED  (< 30 min + offline) → amber "Cached X min ago"
 *   STALE   (≥ 30 min + offline) → red   "Cached X hours ago" + warning icon
 *
 * Usage on a market price card:
 *   <CachedBadge cachedAt={new Date("2026-05-19T12:00:00Z")} isOnline={false} />
 *
 * @param {{
 *   cachedAt:   Date | string | number | null,
 *   isOnline:   boolean,
 *   className?: string,
 * }} props
 */

"use client";

import React, { useState, useEffect } from "react";
import { formatCacheAge, isCacheStale, OFFLINE_COLORS } from "../constants/offlineConfig";

// ─── Live pulsing dot ─────────────────────────────────────────────────────────

const DOT_CSS = `
@keyframes cb-pulse {
  0%,100% { opacity: 1;   transform: scale(1);   }
  50%      { opacity: 0.5; transform: scale(0.85); }
}
.cb-live-dot { animation: cb-pulse 2s ease-in-out infinite; }
`;

function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("cb-styles")) return;
  const tag = document.createElement("style");
  tag.id = "cb-styles";
  tag.textContent = DOT_CSS;
  document.head.appendChild(tag);
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CachedBadge({ cachedAt, isOnline = true, style }) {
  injectCSS();

  // Refresh the label every 60 s so "2 min ago" stays accurate
  const [label, setLabel] = useState(() => formatCacheAge(cachedAt));

  useEffect(() => {
    setLabel(formatCacheAge(cachedAt));
    const interval = setInterval(() => setLabel(formatCacheAge(cachedAt)), 60_000);
    return () => clearInterval(interval);
  }, [cachedAt]);

  // ── Online: show "Live" pill ──────────────────────────────────────────────

  if (isOnline) {
    return (
      <div
        aria-label="Data is live"
        style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          5,
          padding:      "3px 9px",
          borderRadius: 20,
          background:   "#D1FAE5",
          border:       "1px solid #A7F3D0",
          ...style,
        }}
      >
        <span
          className="cb-live-dot"
          aria-hidden="true"
          style={{
            width:        7,
            height:       7,
            borderRadius: "50%",
            background:   OFFLINE_COLORS.secondary,
            flexShrink:   0,
          }}
        />
        <span style={{ fontSize: 10, fontWeight: 700, color: OFFLINE_COLORS.primary, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Live
        </span>
      </div>
    );
  }

  // ── Offline: determine staleness level ────────────────────────────────────

  const stale = isCacheStale(cachedAt);

  const colors = stale
    ? {
        bg:     OFFLINE_COLORS.errorContainer,
        border: `${OFFLINE_COLORS.error}44`,
        text:   OFFLINE_COLORS.onErrorContainer,
        icon:   "history_toggle_off",
      }
    : {
        bg:     OFFLINE_COLORS.staleAmberBg,
        border: `${OFFLINE_COLORS.staleAmber}44`,
        text:   OFFLINE_COLORS.staleAmber,
        icon:   "history",
      };

  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          5,
        padding:      "3px 9px",
        borderRadius: 20,
        background:   colors.bg,
        border:       `1px solid ${colors.border}`,
        ...style,
      }}
    >
      <span
        className="material-symbols-outlined"
        aria-hidden="true"
        style={{ fontSize: 12, color: colors.text, flexShrink: 0 }}
      >
        {colors.icon}
      </span>
      <span
        style={{
          fontSize:      10,
          fontWeight:    700,
          color:         colors.text,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          whiteSpace:    "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
