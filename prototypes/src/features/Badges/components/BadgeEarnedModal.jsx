/**
 * components/BadgeEarnedModal.jsx
 *
 * Celebrates a newly earned badge with:
 *   • Full-screen confetti (ConfettiOverlay)
 *   • Animated modal card (slide-up + scale-in)
 *   • Badge icon, name, description, XP reward
 *   • "Awesome!" dismiss button  (also auto-dismisses after 6 s)
 *
 * @param {{
 *   badge:     EnrichedBadge,
 *   onDismiss: () => void,
 * }} props
 */

import React, { useEffect, useRef, useState } from "react";
import ConfettiOverlay from "./ConfettiOverlay";

// Inject keyframe styles once
const STYLES = `
@keyframes badge-modal-in {
  from { opacity: 0; transform: translateY(60px) scale(0.88); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}
@keyframes badge-icon-pulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(0,0,0,0.08); }
  50%      { box-shadow: 0 0 0 14px rgba(0,0,0,0);  }
}
@keyframes badge-xp-pop {
  0%   { opacity: 0; transform: translateY(8px) scale(0.8); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.1); }
  100% { opacity: 1; transform: translateY(0)    scale(1);   }
}
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("badge-modal-styles")) return;
  const tag = document.createElement("style");
  tag.id        = "badge-modal-styles";
  tag.innerHTML = STYLES;
  document.head.appendChild(tag);
}

const AUTO_DISMISS_MS = 6000;

function BadgeEarnedModal({ badge, onDismiss }) {
  const [confettiActive, setConfettiActive] = useState(true);
  const timerRef = useRef(null);

  injectStyles();

  // Auto-dismiss
  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  if (!badge) return null;

  return (
    <>
      {/* Confetti layer */}
      <ConfettiOverlay
        active={confettiActive}
        onComplete={() => setConfettiActive(false)}
      />

      {/* Backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Badge earned: ${badge.name}`}
        style={{
          position:       "fixed",
          inset:          0,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          background:     "rgba(0,0,0,0.45)",
          zIndex:         9998,
          padding:        "0 20px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onDismiss();
        }}
      >
        {/* Card */}
        <div
          style={{
            background:   "#fff",
            borderRadius: 20,
            padding:      "32px 28px 24px",
            maxWidth:     360,
            width:        "100%",
            textAlign:    "center",
            animation:    "badge-modal-in 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards",
            boxShadow:    "0 24px 80px rgba(0,0,0,0.22)",
            position:     "relative",
            overflow:     "hidden",
          }}
        >
          {/* Decorative top band */}
          <div
            aria-hidden="true"
            style={{
              position:   "absolute",
              top:        0, left: 0, right: 0,
              height:     5,
              background: `linear-gradient(90deg, ${badge.color}44, ${badge.color}, ${badge.color}44)`,
            }}
          />

          {/* "New badge!" label */}
          <div
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            5,
              fontSize:       11,
              fontWeight:     600,
              letterSpacing:  "0.08em",
              textTransform:  "uppercase",
              color:          badge.color,
              background:     badge.bgColor,
              padding:        "4px 12px",
              borderRadius:   20,
              marginBottom:   20,
            }}
          >
            <i className="ti ti-sparkles" aria-hidden="true" style={{ fontSize: 12 }} />
            New Badge Unlocked
          </div>

          {/* Badge icon */}
          <div
            aria-hidden="true"
            style={{
              width:          80,
              height:         80,
              borderRadius:   "50%",
              background:     badge.bgColor,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              margin:         "0 auto 16px",
              animation:      "badge-icon-pulse 1.6s ease-in-out 0.4s infinite",
              border:         `3px solid ${badge.color}33`,
            }}
          >
            <i
              className={badge.icon}
              style={{ fontSize: 34, color: badge.color }}
            />
          </div>

          {/* Name */}
          <h2
            style={{
              margin:     "0 0 8px",
              fontSize:   22,
              fontWeight: 600,
              color:      "#111",
              lineHeight: 1.2,
            }}
          >
            {badge.name}
          </h2>

          {/* Description */}
          <p
            style={{
              margin:     "0 0 20px",
              fontSize:   14,
              color:      "#555",
              lineHeight: 1.5,
            }}
          >
            {badge.description}
          </p>

          {/* XP reward chip */}
          <div
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            6,
              background:     "#FEF9C3",
              border:         "1px solid #FDE68A",
              borderRadius:   12,
              padding:        "6px 16px",
              fontSize:       15,
              fontWeight:     600,
              color:          "#854D0E",
              marginBottom:   24,
              animation:      "badge-xp-pop 0.5s ease 0.55s both",
            }}
          >
            <i className="ti ti-bolt" aria-hidden="true" style={{ fontSize: 15 }} />
            +{badge.xpReward} XP
          </div>

          {/* Dismiss button */}
          <div>
            <button
              onClick={onDismiss}
              style={{
                width:        "100%",
                padding:      "13px 0",
                background:   badge.color,
                color:        "#fff",
                border:       "none",
                borderRadius: 12,
                fontSize:     15,
                fontWeight:   500,
                cursor:       "pointer",
                letterSpacing:"0.01em",
              }}
            >
              Awesome!
            </button>
          </div>

          {/* Auto-dismiss hint */}
          <p
            style={{
              marginTop: 10,
              fontSize:  11,
              color:     "#aaa",
            }}
          >
            Auto-closes in {AUTO_DISMISS_MS / 1000} seconds
          </p>
        </div>
      </div>
    </>
  );
}

export default BadgeEarnedModal;
