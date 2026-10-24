/**
 * components/CurrentUserBanner.jsx
 *
 * Always-visible footer section that pins the current user's rank
 * below the Top 50 list — even when they fall outside it.
 *
 * Shows:
 *   • A "your position" divider
 *   • The current user's FarmerRow (highlighted in blue)
 *   • An XP gap hint ("X more XP to crack Top 50") or a success badge
 *
 * @param {{
 *   currentUser: { id: number, name: string, state: string },
 *   cuStats:     { xp: number, streak: number, rank: number },
 *   maxXp:       number,
 *   xpGap:       number | null,
 * }} props
 */

import React    from "react";
import FarmerRow from "./FarmerRow";
import { formatXP } from "../utils/formatters";

function CurrentUserBanner({ currentUser, cuStats, maxXp, xpGap }) {
  return (
    <>
      {/* ── Divider ── */}
      <div
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         6,
          padding:     "10px 16px",
          background:  "var(--color-background-secondary, #f8f8f8)",
        }}
      >
        <div style={{ flex: 1, height: "0.5px", background: "var(--color-border-secondary, rgba(0,0,0,0.15))" }} />
        <span
          style={{
            fontSize:   11,
            color:      "var(--color-text-secondary, #6b7280)",
            padding:    "0 8px",
            whiteSpace: "nowrap",
          }}
        >
          your position
        </span>
        <div style={{ flex: 1, height: "0.5px", background: "var(--color-border-secondary, rgba(0,0,0,0.15))" }} />
      </div>

      {/* ── Current user row ── */}
      <FarmerRow
        farmer={{
          id:     currentUser.id,
          name:   currentUser.name,
          state:  currentUser.state,
          xp:     cuStats.xp,
          streak: cuStats.streak,
        }}
        rank={cuStats.rank}
        isCurrentUser={true}
        maxXp={maxXp}
      />

      {/* ── XP gap / success hint ── */}
      <div
        style={{
          padding:    "8px 16px",
          textAlign:  "center",
          borderTop:  "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        }}
      >
        {xpGap !== null && xpGap > 0 ? (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary, #6b7280)" }}>
            <i
              className="ti ti-trending-up"
              style={{ marginRight: 4, fontSize: 12, color: "#0F6E56", verticalAlign: -1 }}
              aria-hidden="true"
            />
            {formatXP(xpGap)} more XP to crack Top 50
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "#0F6E56" }}>
            <i
              className="ti ti-circle-check"
              style={{ marginRight: 4, fontSize: 12, verticalAlign: -1 }}
              aria-hidden="true"
            />
            You're in the Top 50
          </span>
        )}
      </div>
    </>
  );
}

export default CurrentUserBanner;
