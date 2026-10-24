/**
 * components/FarmerRow.jsx
 *
 * A single row in the leaderboard table.
 * Renders: rank badge · avatar · name + state badge · relative XP bar · XP score · streak.
 *
 * @param {{
 *   farmer:        { id: number, name: string, state: string, xp: number, streak: number },
 *   rank:          number,
 *   isCurrentUser: boolean,
 *   maxXp:         number,   // rank-1 XP, used to scale the progress bar
 * }} props
 */

import React from "react";
import RankBadge  from "./RankBadge";
import Avatar     from "./Avatar";
import StateBadge from "./StateBadge";
import { formatXP } from "../utils/formatters";

/** Returns the correct bar colour for each rank band */
function getBarColor(rank, isCurrentUser) {
  if (rank === 1) return "#D97706";                                        // gold
  if (rank <= 3)  return "#0F6E56";                                        // deep green
  if (rank <= 10) return "#1D9E75";                                        // teal
  if (isCurrentUser) return "var(--color-border-info, #93C5FD)";           // blue
  return "var(--color-border-secondary, #d1d5db)";                         // neutral
}

function FarmerRow({ farmer, rank, isCurrentUser, maxXp }) {
  const pct      = Math.round((farmer.xp / maxXp) * 100);
  const barColor = getBarColor(rank, isCurrentUser);

  return (
    <div
      role="row"
      aria-label={`Rank ${rank}: ${farmer.name}, ${farmer.state}, ${farmer.xp} XP, ${farmer.streak} day streak`}
      style={{
        display:     "flex",
        alignItems:  "center",
        gap:         10,
        padding:     "9px 16px",
        background:  isCurrentUser
          ? "var(--color-background-info, #EFF6FF)"
          : "transparent",
        borderBottom: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        borderLeft:   isCurrentUser
          ? "3px solid var(--color-border-info, #60A5FA)"
          : "3px solid transparent",
      }}
    >
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Avatar */}
      <Avatar name={farmer.name} />

      {/* Name + state + XP bar */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
          <span
            style={{
              fontSize:     13,
              fontWeight:   500,
              color:        "var(--color-text-primary, #111)",
              whiteSpace:   "nowrap",
              overflow:     "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {farmer.name}
          </span>
          <StateBadge state={farmer.state} />
          {isCurrentUser && (
            <span
              style={{
                fontSize:  10,
                color:     "var(--color-text-info, #1A56DB)",
                flexShrink: 0,
              }}
            >
              you
            </span>
          )}
        </div>

        {/* Relative XP progress bar */}
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${pct}% of top XP`}
          style={{
            height:     3,
            borderRadius: 2,
            overflow:   "hidden",
            background: "var(--color-background-secondary, #f4f4f4)",
          }}
        >
          <div
            style={{
              width:        `${pct}%`,
              height:       "100%",
              borderRadius: 2,
              background:   barColor,
            }}
          />
        </div>
      </div>

      {/* XP score + streak */}
      <div style={{ textAlign: "right", flexShrink: 0, minWidth: 58 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary, #111)" }}>
          {formatXP(farmer.xp)}{" "}
          <span style={{ fontSize: 10, color: "var(--color-text-secondary, #6b7280)", fontWeight: 400 }}>
            XP
          </span>
        </div>
        <div
          style={{
            fontSize:     11,
            color:        "var(--color-text-secondary, #6b7280)",
            display:      "flex",
            alignItems:   "center",
            gap:          2,
            justifyContent: "flex-end",
            marginTop:    2,
          }}
        >
          <i className="ti ti-flame" style={{ fontSize: 11, color: "#EF9F27" }} aria-hidden="true" />
          {farmer.streak}d
        </div>
      </div>
    </div>
  );
}

export default FarmerRow;
