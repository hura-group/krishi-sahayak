/**
 * components/Avatar.jsx
 *
 * Circular avatar showing a farmer's initials on a deterministic colour
 * derived from their name — no image upload required.
 *
 * @param {{ name: string, size?: number }} props
 */

import React from "react";
import { getInitials, getAvatarColor } from "../utils/formatters";

function Avatar({ name, size = 36 }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width:          size,
        height:         size,
        borderRadius:   "50%",
        background:     getAvatarColor(name),
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontSize:       12,
        fontWeight:     500,
        color:          "#fff",
        flexShrink:     0,
        letterSpacing:  "0.03em",
        userSelect:     "none",
      }}
    >
      {getInitials(name)}
    </div>
  );
}

export default Avatar;
