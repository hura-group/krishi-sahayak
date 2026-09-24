/**
 * LeaderboardScreen.jsx
 *
 * Top-level screen component — pure render layer.
 * All state and derived data is handled by useLeaderboard.
 *
 * Usage (with mock data):
 *   <LeaderboardScreen />
 *
 * Usage (with real API data):
 *   <LeaderboardScreen
 *     weeklyData={weeklyApiData}
 *     monthlyData={monthlyApiData}
 *     currentUser={currentUserData}
 *   />
 *
 * Required peer dependency:
 *   Tabler Icons CSS — https://tabler.io/icons
 *   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
 */

import React from "react";
import { INDIAN_STATES }       from "./constants/states";
import { MOCK_WEEKLY_DATA,
         MOCK_MONTHLY_DATA,
         MOCK_CURRENT_USER }   from "./data/mockLeaderboard";
import { useLeaderboard }      from "./hooks/useLeaderboard";
import FarmerRow               from "./components/FarmerRow";
import CurrentUserBanner       from "./components/CurrentUserBanner";

function LeaderboardScreen({
  weeklyData  = MOCK_WEEKLY_DATA,
  monthlyData = MOCK_MONTHLY_DATA,
  currentUser = MOCK_CURRENT_USER,
}) {
  const {
    tab,          setTab,
    stateFilter,  setStateFilter,
    top50,        maxXp,
    cuStats,      showCurrentUser,  xpGap,
    periodLabel,
  } = useLeaderboard({ weeklyData, monthlyData, currentUser });

  return (
    <div
      style={{
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
        maxWidth:   540,
        margin:     "0 auto",
        background: "var(--color-background-primary, #ffffff)",
        borderRadius: "var(--border-radius-lg, 12px)",
        border:     "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
        overflow:   "hidden",
      }}
    >
      <h2 className="sr-only">Farmer Leaderboard</h2>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ padding: "18px 16px 0" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <i className="ti ti-trophy" style={{ fontSize: 20, color: "#D97706" }} aria-hidden="true" />
          <span style={{ fontSize: 17, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
            Leaderboard
          </span>
          <span
            style={{
              marginLeft:   "auto",
              fontSize:     11,
              color:        "var(--color-text-secondary, #6b7280)",
              background:   "var(--color-background-secondary, #f5f5f5)",
              padding:      "2px 9px",
              borderRadius: 10,
              border:       "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
            }}
          >
            {periodLabel}
          </span>
        </div>

        <p style={{ margin: "0 0 14px 28px", fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
          {top50.length} farmers · Updated 4 min ago
        </p>

        {/* ── Tab switcher ── */}
        <div
          role="tablist"
          aria-label="Leaderboard period"
          style={{
            display:      "flex",
            background:   "var(--color-background-secondary, #f4f4f4)",
            borderRadius: "var(--border-radius-md, 8px)",
            padding:      3,
            marginBottom: 12,
          }}
        >
          {["weekly", "monthly"].map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              style={{
                flex:       1,
                padding:    "7px 0",
                border:     "none",
                borderRadius: 6,
                cursor:     "pointer",
                fontSize:   13,
                fontWeight: 500,
                transition: "background 0.15s, color 0.15s",
                background: tab === t
                  ? "var(--color-background-primary, #fff)"
                  : "transparent",
                color: tab === t
                  ? "var(--color-text-primary, #111)"
                  : "var(--color-text-secondary, #6b7280)",
              }}
            >
              <i
                className={`ti ti-${t === "weekly" ? "calendar-week" : "calendar-month"}`}
                style={{ marginRight: 5, fontSize: 13, verticalAlign: -1 }}
                aria-hidden="true"
              />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── State filter ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <i
            className="ti ti-map-pin"
            style={{ fontSize: 15, color: "var(--color-text-secondary, #6b7280)", flexShrink: 0 }}
            aria-hidden="true"
          />
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            aria-label="Filter by state"
            style={{ flex: 1, fontSize: 13 }}
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {stateFilter !== "All India" && (
            <button
              onClick={() => setStateFilter("All India")}
              aria-label="Clear state filter"
              style={{
                background:   "none",
                cursor:       "pointer",
                padding:      "4px 10px",
                fontSize:     12,
                color:        "var(--color-text-secondary, #6b7280)",
                border:       "0.5px solid var(--color-border-secondary, rgba(0,0,0,0.2))",
                borderRadius: 6,
              }}
            >
              <i className="ti ti-x" style={{ fontSize: 11 }} aria-hidden="true" /> clear
            </button>
          )}
        </div>
      </div>

      {/* ── Column headers ──────────────────────────────────────── */}
      <div
        role="rowgroup"
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          padding:      "5px 16px",
          background:   "var(--color-background-secondary, #f4f4f4)",
          borderTop:    "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
          borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        }}
      >
        <span style={{ width: 34, fontSize: 11, color: "var(--color-text-secondary, #6b7280)" }}>#</span>
        <span style={{ width: 36 }} aria-hidden="true" />
        <span style={{ flex: 1, fontSize: 11, color: "var(--color-text-secondary, #6b7280)" }}>Farmer · State</span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary, #6b7280)", minWidth: 58, textAlign: "right" }}>
          XP / Streak
        </span>
      </div>

      {/* ── Top 50 list ─────────────────────────────────────────── */}
      <div role="rowgroup">
        {top50.map((farmer, idx) => (
          <FarmerRow
            key={farmer.id}
            farmer={farmer}
            rank={idx + 1}
            isCurrentUser={false}
            maxXp={maxXp}
          />
        ))}
      </div>

      {/* ── Current user banner ─────────────────────────────────── */}
      {showCurrentUser && (
        <CurrentUserBanner
          currentUser={currentUser}
          cuStats={cuStats}
          maxXp={maxXp}
          xpGap={xpGap}
        />
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}

export default LeaderboardScreen;
