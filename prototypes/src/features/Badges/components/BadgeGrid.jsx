/**
 * components/BadgeGrid.jsx
 *
 * Full badge grid for the profile screen.
 *
 * Features:
 *   • Earned / Locked / All filter tabs
 *   • 3-column responsive grid
 *   • Progress bar + stat summary at the top
 *   • Loading skeleton and empty states
 *
 * @param {{
 *   badges:       EnrichedBadge[],
 *   earnedCount:  number,
 *   isLoading:    boolean,
 *   error?:       Error|null,
 *   onBadgePress?: (badge: EnrichedBadge) => void,
 * }} props
 */

import React, { useState, useMemo } from "react";
import BadgeCard from "./BadgeCard";
import { BADGE_CATEGORIES } from "../constants/badgeDefinitions";

// ─── Filter labels ─────────────────────────────────────────────────────────────

const FILTER_LABELS = {
  all:       "All",
  earned:    "Earned",
  locked:    "Locked",
  farming:   "Farming",
  market:    "Market",
  social:    "Social",
  learning:  "Learning",
  milestone: "Milestone",
};

const FILTER_OPTIONS = ["all", "earned", "locked", ...BADGE_CATEGORIES.filter((c) => c !== "all")];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        borderRadius: 14,
        background:   "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation:    "badge-skeleton 1.4s ease infinite",
        height:       140,
      }}
    />
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

function BadgeGrid({ badges = [], earnedCount = 0, isLoading = false, error = null, onBadgePress }) {
  const [activeFilter, setActiveFilter] = useState("all");

  const total = badges.length;

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case "all":    return badges;
      case "earned": return badges.filter((b) => b.earned);
      case "locked": return badges.filter((b) => !b.earned);
      default:       return badges.filter((b) => b.category === activeFilter);
    }
  }, [badges, activeFilter]);

  const progressPct = total > 0 ? Math.round((earnedCount / total) * 100) : 0;

  return (
    <div
      style={{
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        padding:    "0 0 24px",
      }}
    >
      {/* Inject skeleton animation */}
      <style>{`
        @keyframes badge-skeleton {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <i className="ti ti-medal" style={{ fontSize: 19, color: "#CA8A04" }} aria-hidden="true" />
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
            Achievements
          </span>
          <span
            style={{
              marginLeft:   "auto",
              fontSize:     12,
              fontWeight:   600,
              color:        "#0F6E56",
              background:   "#D1FAE5",
              padding:      "2px 10px",
              borderRadius: 10,
            }}
          >
            {earnedCount} / {total}
          </span>
        </div>

        {/* Progress bar */}
        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${earnedCount} of ${total} badges earned`}
          style={{
            height:       6,
            borderRadius: 3,
            background:   "var(--color-background-secondary, #f0f0f0)",
            overflow:     "hidden",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width:        `${progressPct}%`,
              height:       "100%",
              borderRadius: 3,
              background:   "linear-gradient(90deg, #0F6E56, #16A34A)",
              transition:   "width 0.5s ease",
            }}
          />
        </div>

        {/* ── Filter tabs ── */}
        <div
          role="tablist"
          aria-label="Filter badges"
          style={{
            display:        "flex",
            gap:            6,
            overflowX:      "auto",
            paddingBottom:  4,
            marginBottom:   14,
            scrollbarWidth: "none",
          }}
        >
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink:   0,
                padding:      "5px 12px",
                border:       "1px solid",
                borderColor:  activeFilter === f ? "#0F6E56" : "rgba(0,0,0,0.12)",
                borderRadius: 20,
                fontSize:     12,
                fontWeight:   500,
                cursor:       "pointer",
                background:   activeFilter === f ? "#0F6E56" : "transparent",
                color:        activeFilter === f ? "#fff" : "var(--color-text-secondary, #6b7280)",
                transition:   "all 0.15s",
              }}
            >
              {FILTER_LABELS[f] ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ── */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 10,
          padding:             "0 16px",
        }}
      >
        {/* Loading state */}
        {isLoading && Array.from({ length: 15 }, (_, i) => <SkeletonCard key={i} />)}

        {/* Error state */}
        {!isLoading && error && (
          <div
            role="alert"
            style={{
              gridColumn: "1 / -1",
              textAlign:  "center",
              padding:    "32px 16px",
              color:      "#991B1B",
              fontSize:   13,
            }}
          >
            <i className="ti ti-alert-circle" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
            Could not load badges. Please try again.
          </div>
        )}

        {/* Empty filtered state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign:  "center",
              padding:    "32px 16px",
              color:      "var(--color-text-secondary, #6b7280)",
              fontSize:   13,
            }}
          >
            <i className="ti ti-mood-smile" style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
            No badges match this filter yet.
          </div>
        )}

        {/* Badge cards */}
        {!isLoading &&
          !error &&
          filtered.map((badge) => (
            <div
              key={badge.id}
              onClick={() => onBadgePress?.(badge)}
              style={{ cursor: onBadgePress ? "pointer" : "default" }}
            >
              <BadgeCard badge={badge} />
            </div>
          ))}
      </div>
    </div>
  );
}

export default BadgeGrid;
