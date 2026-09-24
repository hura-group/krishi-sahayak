/**
 * components/RankBadge.jsx
 *
 * Displays a rank position with distinct visual treatment:
 *   #1  → gold trophy icon
 *   #2  → silver medal icon
 *   #3  → bronze medal icon
 *   4–10 → teal pill with number
 *   11+  → plain number
 *
 * @param {{ rank: number }} props
 */

import React from "react";

const BASE_STYLE = {
  width:          34,
  height:         34,
  borderRadius:   8,
  display:        "flex",
  alignItems:     "center",
  justifyContent: "center",
  flexShrink:     0,
  fontSize:       13,
  fontWeight:     500,
};

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <div style={{ ...BASE_STYLE, background: "#FEF3C7" }}>
        <i className="ti ti-trophy" style={{ fontSize: 16, color: "#D97706" }} aria-hidden="true" />
      </div>
    );
  }

  if (rank === 2) {
    return (
      <div style={{ ...BASE_STYLE, background: "#F1F5F9" }}>
        <i className="ti ti-medal" style={{ fontSize: 15, color: "#94A3B8" }} aria-hidden="true" />
      </div>
    );
  }

  if (rank === 3) {
    return (
      <div style={{ ...BASE_STYLE, background: "#FEF0E6" }}>
        <i className="ti ti-medal" style={{ fontSize: 15, color: "#CD7F32" }} aria-hidden="true" />
      </div>
    );
  }

  if (rank <= 10) {
    return (
      <div style={{ ...BASE_STYLE, background: "#E1F5EE", color: "#085041" }}>
        {rank}
      </div>
    );
  }

  return (
    <div style={{ ...BASE_STYLE, color: "var(--color-text-secondary, #6b7280)" }}>
      {rank}
    </div>
  );
}

export default RankBadge;
