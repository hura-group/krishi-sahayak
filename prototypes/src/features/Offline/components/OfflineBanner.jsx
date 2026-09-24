/**
 * src/features/Offline/components/OfflineBanner.jsx
 *
 * Red sticky banner displayed at the top of the screen when offline.
 *
 * Behaviour:
 *   • Slides down when offline, slides back up when online
 *   • Dismissable via X button (stays hidden for the current session)
 *   • Shows connection type when available (e.g. "Slow 2G connection")
 *   • Auto-restores when coming back online (never stale)
 *
 * Usage:
 *   const { isOffline } = useNetworkStatus();
 *   <OfflineBanner isOffline={isOffline} />
 *
 * Mount directly below your <header> / TopAppBar so it sticks at top-16.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { OFFLINE_COLORS } from "../constants/offlineConfig";

const CSS = `
@keyframes ob-slide-down {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes ob-slide-up {
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(-100%); opacity: 0; }
}
.ob-enter { animation: ob-slide-down 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
.ob-exit  { animation: ob-slide-up   0.3s  cubic-bezier(0.4,0,1,1)    forwards; }
`;

function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("ob-styles")) return;
  const tag = document.createElement("style");
  tag.id = "ob-styles";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

/** Maps connection type codes to friendly labels */
function connectionLabel(type) {
  const map = {
    "slow-2g": "Very slow connection",
    "2g":      "Slow 2G connection",
    "3g":      "3G connection — some features limited",
    "4g":      null,
    "wifi":    null,
    "unknown": null,
  };
  return map[type] ?? null;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function OfflineBanner({
  isOffline      = false,
  connectionType = "unknown",
  onDismiss,
  /** Override the default message */
  message,
  /** CSS top offset — match your header height (default: 64px = h-16) */
  topOffset      = "64px",
}) {
  injectCSS();

  const [dismissed,   setDismissed]   = useState(false);
  const [animClass,   setAnimClass]   = useState("");
  const [rendered,    setRendered]    = useState(false);
  const exitTimerRef = useRef(null);

  const shouldShow = isOffline && !dismissed;

  // Animate in
  useEffect(() => {
    if (shouldShow) {
      setRendered(true);
      clearTimeout(exitTimerRef.current);
      // Small tick so the element is mounted before animating
      requestAnimationFrame(() => setAnimClass("ob-enter"));
    } else if (rendered) {
      // Animate out, then unmount
      setAnimClass("ob-exit");
      exitTimerRef.current = setTimeout(() => setRendered(false), 320);
    }
  }, [shouldShow]);

  // When coming back online, reset dismissed so banner shows again next time
  useEffect(() => {
    if (!isOffline) setDismissed(false);
  }, [isOffline]);

  if (!rendered) return null;

  const connNote = connectionLabel(connectionType);
  const displayMessage =
    message ??
    (connNote ? connNote : "No internet connection. Using offline mode.");

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label="Offline notification"
      className={animClass}
      style={{
        position:       "sticky",
        top:            topOffset,
        zIndex:         50,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        gap:            12,
        padding:        "10px 16px",
        background:     OFFLINE_COLORS.error,
        color:          "#FFFFFF",
        // Subtle border for depth
        borderBottom:   "1px solid rgba(0,0,0,0.15)",
      }}
    >
      {/* Left: icon + message */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, flexShrink: 0 }}
          aria-hidden="true"
        >
          cloud_off
        </span>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, lineHeight: 1.3, letterSpacing: "0.01em" }}>
            {displayMessage}
          </p>
          {connNote === null && isOffline && (
            <p style={{ margin: "2px 0 0", fontSize: 11, opacity: 0.85, lineHeight: 1.3 }}>
              Data shown below was cached from your last sync.
            </p>
          )}
        </div>
      </div>

      {/* Right: dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss offline banner"
        style={{
          background:    "none",
          border:        "none",
          cursor:        "pointer",
          padding:       4,
          borderRadius:  "50%",
          flexShrink:    0,
          display:       "flex",
          alignItems:    "center",
          color:         "#fff",
          opacity:       0.85,
          transition:    "opacity 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.background = "none"; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
          close
        </span>
      </button>
    </div>
  );
}
