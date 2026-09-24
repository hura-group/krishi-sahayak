/**
 * src/features/Offline/components/SyncToast.jsx
 *
 * Slide-up toast shown the moment connectivity is restored.
 * Progresses through three states:
 *
 *   SYNCING  → "Back online! Syncing 3 updates…"  (spinner)
 *   DONE     → "All synced ✓"                     (check icon, 2 s)
 *   HIDDEN   → unmounted
 *
 * Usage (mount once at app root, below all content):
 *   const { isOnline, justCameOnline } = useNetworkStatus();
 *   const { syncCount, isSyncing, syncedCount } = useOfflineSync({ isOnline });
 *
 *   <SyncToast
 *     isVisible={justCameOnline || isSyncing}
 *     syncCount={syncCount}
 *     isSyncing={isSyncing}
 *     syncedCount={syncedCount}
 *     onDismiss={() => {}}
 *   />
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { OFFLINE_COLORS, OFFLINE_CONFIG } from "../constants/offlineConfig";

// ─── Styles ───────────────────────────────────────────────────────────────────

const CSS = `
@keyframes st-slide-up {
  from { transform: translateY(120%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
@keyframes st-slide-down {
  from { transform: translateY(0);    opacity: 1; }
  to   { transform: translateY(120%); opacity: 0; }
}
@keyframes st-spin {
  to { transform: rotate(360deg); }
}
@keyframes st-check-pop {
  0%   { transform: scale(0.4); opacity: 0; }
  70%  { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
}
.st-enter { animation: st-slide-up   0.42s cubic-bezier(0.16,1,0.3,1) forwards; }
.st-exit  { animation: st-slide-down 0.3s  cubic-bezier(0.4,0,1,1)    forwards; }
.st-spin  { animation: st-spin       1s    linear                      infinite; }
.st-check { animation: st-check-pop  0.4s  cubic-bezier(0.34,1.56,0.64,1) forwards; }
`;

function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("st-styles")) return;
  const tag = document.createElement("style");
  tag.id = "st-styles";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ─── States ───────────────────────────────────────────────────────────────────

const STATE = { HIDDEN: "hidden", SYNCING: "syncing", DONE: "done" };

// ─── Component ─────────────────────────────────────────────────────────────────

export default function SyncToast({
  /** Show the toast */
  isVisible   = false,
  /** Number of items currently in the sync queue */
  syncCount   = 0,
  /** True while the sync is in flight */
  isSyncing   = false,
  /** Number of items that were synced in the completed run */
  syncedCount = 0,
  /** Called when toast is dismissed or auto-hides */
  onDismiss,
  /** px from bottom edge (default 96 — clears bottom nav) */
  bottomOffset = 96,
}) {
  injectCSS();

  const [phase,     setPhase]     = useState(STATE.HIDDEN);
  const [animClass, setAnimClass] = useState("");
  const [rendered,  setRendered]  = useState(false);

  const doneTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  // ── Phase transitions ─────────────────────────────────────────────────────

  useEffect(() => {
    if (isVisible || isSyncing) {
      clearTimeout(exitTimerRef.current);
      clearTimeout(doneTimerRef.current);
      setRendered(true);
      setPhase(STATE.SYNCING);
      requestAnimationFrame(() => setAnimClass("st-enter"));
    }
  }, [isVisible, isSyncing]);

  // When sync finishes (isSyncing was true, now false with syncedCount > 0)
  const prevSyncing = useRef(false);
  useEffect(() => {
    if (prevSyncing.current && !isSyncing && syncedCount > 0) {
      setPhase(STATE.DONE);
      // Auto-dismiss after showing "done" for 2.5 s
      doneTimerRef.current = setTimeout(dismiss, 2_500);
    }
    prevSyncing.current = isSyncing;
  }, [isSyncing, syncedCount]);

  // Auto-dismiss when no items to sync (came online but queue was empty)
  useEffect(() => {
    if (isVisible && syncCount === 0 && !isSyncing) {
      doneTimerRef.current = setTimeout(() => {
        setPhase(STATE.DONE);
        doneTimerRef.current = setTimeout(dismiss, 2_000);
      }, 800);
    }
  }, [isVisible, syncCount, isSyncing]);

  // Auto-dismiss after max display time
  useEffect(() => {
    if (rendered) {
      const timer = setTimeout(dismiss, OFFLINE_CONFIG.SYNC_TOAST_DURATION_MS + 3_000);
      return () => clearTimeout(timer);
    }
  }, [rendered]);

  function dismiss() {
    clearTimeout(doneTimerRef.current);
    setAnimClass("st-exit");
    exitTimerRef.current = setTimeout(() => {
      setRendered(false);
      setPhase(STATE.HIDDEN);
      onDismiss?.();
    }, 320);
  }

  if (!rendered) return null;

  // ── Content per phase ─────────────────────────────────────────────────────

  const isDone = phase === STATE.DONE;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={isDone ? "Sync complete" : "Syncing updates"}
      className={animClass}
      style={{
        position:   "fixed",
        bottom:     bottomOffset,
        left:       "50%",
        transform:  "translateX(-50%)",
        width:      "calc(100% - 32px)",
        maxWidth:   400,
        zIndex:     70,
      }}
    >
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            12,
          padding:        "14px 16px",
          background:     isDone ? OFFLINE_COLORS.primary : OFFLINE_COLORS.secondary,
          color:          "#ffffff",
          borderRadius:   16,
          boxShadow:      "0 8px 32px rgba(0,0,0,0.22)",
          border:         "1px solid rgba(255,255,255,0.15)",
          transition:     "background 0.3s ease",
        }}
      >
        {/* Left: icon + text */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          {/* Icon */}
          <div
            aria-hidden="true"
            style={{
              width:          36,
              height:         36,
              borderRadius:   "50%",
              background:     "rgba(255,255,255,0.15)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              flexShrink:     0,
            }}
          >
            {isDone ? (
              <span
                className="material-symbols-outlined st-check"
                style={{ fontSize: 20, color: "#fff" }}
              >
                check_circle
              </span>
            ) : (
              <span
                className="material-symbols-outlined st-spin"
                style={{ fontSize: 20, color: "#fff" }}
              >
                sync
              </span>
            )}
          </div>

          {/* Text */}
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
              {isDone ? "All synced!" : "Back online!"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.88, lineHeight: 1.3 }}>
              {isDone
                ? syncedCount > 0
                  ? `${syncedCount} update${syncedCount > 1 ? "s" : ""} uploaded successfully`
                  : "Everything is up to date"
                : syncCount > 0
                ? `Syncing ${syncCount} saved update${syncCount > 1 ? "s" : ""}…`
                : "Checking for updates…"}
            </p>
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          style={{
            background:    "none",
            border:        "none",
            cursor:        "pointer",
            padding:       4,
            borderRadius:  "50%",
            flexShrink:    0,
            color:         "rgba(255,255,255,0.7)",
            display:       "flex",
            alignItems:    "center",
            transition:    "color 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
            close
          </span>
        </button>
      </div>
    </div>
  );
}
