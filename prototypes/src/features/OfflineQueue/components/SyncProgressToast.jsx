/**
 * src/features/OfflineQueue/components/SyncProgressToast.jsx
 *
 * Animated toast that shows per-item sync progress during queue processing.
 *
 * Phases:
 *   syncing        → shows spinning icon + "Syncing item X of Y: <action label>"
 *   done           → green check + "All X items synced successfully"
 *   partial_failure→ amber warning + "X synced, Y failed — tap to review"
 *   idle           → null (not rendered)
 *
 * Usage (mount once at root, below OfflineBanner):
 *   const { progress, resetProgress } = useOfflineQueueContext();
 *   <SyncProgressToast progress={progress} onDismiss={resetProgress} />
 *
 * @param {{
 *   progress:   import("../hooks/useOfflineQueue").SyncProgress,
 *   onDismiss:  () => void,
 *   onReview?:  () => void,   // navigate to Settings queue screen
 *   bottomOffset?: number,    // px from bottom edge (default: 96)
 * }} props
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import { ACTION_LABELS, QUEUE_CONFIG }        from "../constants/queueConfig";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
@keyframes spt-up   { from{transform:translateX(-50%) translateY(120%);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
@keyframes spt-down { from{transform:translateX(-50%) translateY(0);opacity:1}    to{transform:translateX(-50%) translateY(120%);opacity:0} }
@keyframes spt-spin { to{transform:rotate(360deg)} }
@keyframes spt-pop  { 0%{transform:scale(.4);opacity:0} 70%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} }
@keyframes spt-bar  { from{width:0} to{width:100%} }
.spt-enter { animation: spt-up   0.42s cubic-bezier(.16,1,.3,1) forwards }
.spt-exit  { animation: spt-down 0.3s  cubic-bezier(.4,0,1,1)  forwards }
.spt-spin  { animation: spt-spin 1s    linear                   infinite }
.spt-pop   { animation: spt-pop  0.4s  cubic-bezier(.34,1.56,.64,1) forwards }
`;

function injectCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("spt-styles")) return;
  const tag = document.createElement("style");
  tag.id = "spt-styles";
  tag.textContent = CSS;
  document.head.appendChild(tag);
}

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  syncing:         "#2c694e",  // secondary
  done:            "#003925",  // primary
  partial_failure: "#B45309",  // amber
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phaseBg(phase) {
  return C[phase] ?? C.syncing;
}

function phaseIcon(phase) {
  if (phase === "done")            return { icon: "check_circle",  cls: "spt-pop" };
  if (phase === "partial_failure") return { icon: "warning",       cls: "spt-pop" };
  return                                  { icon: "sync",          cls: "spt-spin" };
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total, phase }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  if (phase === "idle" || total <= 1) return null;

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Sync progress: ${pct}%`}
      style={{
        height:       3,
        borderRadius: 2,
        background:   "rgba(255,255,255,0.25)",
        overflow:     "hidden",
        marginTop:    8,
      }}
    >
      <div
        style={{
          width:      `${pct}%`,
          height:     "100%",
          background: "#fff",
          borderRadius: 2,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ─── Completed item list (shown in partial_failure state) ─────────────────────

function CompletedList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
      {items.map((item, i) => {
        const label = ACTION_LABELS[item.actionType];
        return (
          <div
            key={i}
            style={{
              display:     "flex",
              alignItems:  "center",
              gap:         6,
              fontSize:    11,
              opacity:     0.9,
              lineHeight:  1.3,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 13,
                color:    item.success ? "#A7F3D0" : "#FCA5A5",
                flexShrink: 0,
              }}
            >
              {item.success ? "check_circle" : "cancel"}
            </span>
            <span>
              {label?.noun ?? item.actionType}
              {!item.success && item.error && (
                <span style={{ opacity: 0.7 }}> — {item.error}</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SyncProgressToast({
  progress,
  onDismiss,
  onReview,
  bottomOffset = 96,
}) {
  injectCSS();

  const [animClass, setAnimClass] = useState("");
  const [rendered,  setRendered]  = useState(false);
  const [expanded,  setExpanded]  = useState(false);

  const exitTimerRef = useRef(null);
  const autoHideRef  = useRef(null);

  const { phase, currentItem, completedItems, synced, failed } = progress;
  const isActive = phase !== "idle";

  // ── Animate in / out ─────────────────────────────────────────────────────

  useEffect(() => {
    if (isActive) {
      clearTimeout(exitTimerRef.current);
      clearTimeout(autoHideRef.current);
      setRendered(true);
      requestAnimationFrame(() => setAnimClass("spt-enter"));
      setExpanded(false);
    }
  }, [isActive]);

  // Auto-hide after done or partial_failure
  useEffect(() => {
    if (phase === "done") {
      autoHideRef.current = setTimeout(
        dismiss, QUEUE_CONFIG.ITEM_TOAST_DURATION_MS
      );
    } else if (phase === "partial_failure") {
      autoHideRef.current = setTimeout(
        dismiss, QUEUE_CONFIG.DONE_TOAST_DURATION_MS
      );
    }
    return () => clearTimeout(autoHideRef.current);
  }, [phase]);

  function dismiss() {
    clearTimeout(autoHideRef.current);
    setAnimClass("spt-exit");
    exitTimerRef.current = setTimeout(() => {
      setRendered(false);
      onDismiss?.();
    }, 320);
  }

  if (!rendered) return null;

  // ── Computed display values ───────────────────────────────────────────────

  const { icon, cls } = phaseIcon(phase);
  const bg            = phaseBg(phase);
  const total         = (currentItem?.total) ?? (synced + failed);
  const current       = synced + failed;

  const title =
    phase === "done"
      ? "All synced!"
      : phase === "partial_failure"
      ? `${synced} synced${failed > 0 ? `, ${failed} failed` : ""}`
      : currentItem
      ? `Syncing ${currentItem.index} of ${currentItem.total}`
      : "Preparing sync…";

  const subtitle =
    phase === "done"
      ? `${synced} item${synced !== 1 ? "s" : ""} uploaded successfully`
      : phase === "partial_failure"
      ? "Tap to review failed items"
      : currentItem
      ? ACTION_LABELS[currentItem.actionType]?.verb ?? "Processing…"
      : "Reading offline queue…";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Sync status: ${title}`}
      className={animClass}
      style={{
        position:    "fixed",
        bottom:      bottomOffset,
        left:        "50%",
        width:       "calc(100% - 32px)",
        maxWidth:    400,
        zIndex:      70,
      }}
    >
      <div
        onClick={() => {
          if (phase === "partial_failure") {
            setExpanded((e) => !e);
            onReview?.();
          }
        }}
        style={{
          background:   bg,
          color:        "#fff",
          borderRadius: 16,
          padding:      expanded ? "14px 16px 12px" : "13px 16px",
          boxShadow:    "0 8px 32px rgba(0,0,0,0.22)",
          border:       "1px solid rgba(255,255,255,0.15)",
          cursor:       phase === "partial_failure" ? "pointer" : "default",
          transition:   "background 0.3s ease",
        }}
      >
        {/* Main row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Icon */}
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span
              className={`material-symbols-outlined ${cls}`}
              aria-hidden="true"
              style={{ fontSize: 19, color: "#fff" }}
            >
              {icon}
            </span>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
              {title}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.9, lineHeight: 1.3 }}>
              {subtitle}
            </p>
          </div>

          {/* Dismiss or expand */}
          {phase === "partial_failure" ? (
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, opacity: 0.7, flexShrink: 0 }}
              aria-hidden="true"
            >
              {expanded ? "expand_more" : "chevron_right"}
            </span>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); dismiss(); }}
              aria-label="Dismiss"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", flexShrink: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 17 }} aria-hidden="true">close</span>
            </button>
          )}
        </div>

        {/* Progress bar (during sync) */}
        {phase === "syncing" && (
          <ProgressBar current={current} total={total} phase={phase} />
        )}

        {/* Expanded failure list */}
        {expanded && <CompletedList items={completedItems} />}
      </div>
    </div>
  );
}
