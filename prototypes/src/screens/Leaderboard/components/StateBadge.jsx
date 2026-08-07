/**
 * components/StateBadge.jsx
 *
 * Compact chip showing a state's 2-letter abbreviation.
 * Falls back to the first two characters of the full name if the state
 * isn't found in the STATE_CODES map (handles future additions gracefully).
 *
 * @param {{ state: string }} props
 */

import React from "react";
import { STATE_CODES } from "../constants/states";

function StateBadge({ state }) {
  const code = STATE_CODES[state] ?? state.substring(0, 2).toUpperCase();

  return (
    <span
      style={{
        fontSize:   10,
        padding:    "1px 6px",
        borderRadius: 4,
        flexShrink: 0,
        background: "var(--color-background-tertiary, #f0f0f0)",
        color:      "var(--color-text-secondary, #6b7280)",
        border:     "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
        fontWeight: 500,
      }}
    >
      {code}
    </span>
  );
}

export default StateBadge;
