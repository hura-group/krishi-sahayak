/**
 * src/features/OfflineQueue/components/QueueUI.jsx
 *
 * Two UI components exported from one file:
 *
 *   1. PendingSyncBadge  — compact red/amber badge shown in Settings nav row
 *                          and anywhere else you want to surface pending count.
 *
 *   2. OfflineQueueSettingsSection — full settings section showing
 *      each pending/failed item with its action type, age, and status.
 *      Includes "Sync Now" and "Retry Failed" action buttons.
 *
 * Both components read from OfflineQueueContext so they never need props
 * beyond what's already in the queue hook.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useOfflineQueueContext }      from "../hooks/useOfflineQueue";
import { ACTION_LABELS, QUEUE_STATUS } from "../constants/queueConfig";

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  primary:         "#003925",
  secondary:       "#2c694e",
  earthRed:        "#79564B",
  amber:           "#B45309",
  amberBg:         "#FEF3C7",
  errorContainer:  "#ffdad6",
  surfaceLow:      "#f4f4ef",
  surfaceDim:      "#dadad5",
  onSurface:       "#1a1c19",
  textSecondary:   "#444743",
};

// ─── Time formatter ───────────────────────────────────────────────────────────

function timeAgo(ms) {
  const diff = Date.now() - ms;
  const m    = Math.floor(diff / 60_000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PendingSyncBadge
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Shows "X items pending sync" with a count bubble.
 * Renders null when there's nothing pending or failed.
 *
 * Size variants:
 *   "sm" — tiny pill, used inline in Settings nav rows
 *   "md" — standard pill with label text (default)
 *
 * @param {{ size?: "sm" | "md", style?: object }} props
 */
export function PendingSyncBadge({ size = "md", style }) {
  const { pendingCount, failedCount } = useOfflineQueueContext();
  const total = pendingCount + failedCount;

  if (total === 0) return null;

  const hasFailures = failedCount > 0;
  const bg    = hasFailures ? C.errorContainer : C.amberBg;
  const color = hasFailures ? C.earthRed       : C.amber;
  const icon  = hasFailures ? "error"          : "cloud_sync";

  if (size === "sm") {
    return (
      <span
        aria-label={`${total} item${total !== 1 ? "s" : ""} pending sync`}
        style={{
          display:      "inline-flex",
          alignItems:   "center",
          justifyContent:"center",
          minWidth:     18,
          height:       18,
          padding:      "0 5px",
          borderRadius: 9,
          background:   color,
          color:        "#fff",
          fontSize:     10,
          fontWeight:   700,
          ...style,
        }}
      >
        {total > 99 ? "99+" : total}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-label={`${total} item${total !== 1 ? "s" : ""} pending sync`}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          6,
        padding:      "5px 12px",
        borderRadius: 20,
        background:   bg,
        border:       `1px solid ${color}44`,
        ...style,
      }}
    >
      <span
        className="material-symbols-outlined"
        aria-hidden="true"
        style={{ fontSize: 14, color }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: "0.02em" }}>
        {total} item{total !== 1 ? "s" : ""} pending sync
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. OfflineQueueSettingsSection
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full settings section showing all pending and failed queue items.
 *
 * Usage in your SettingsScreen:
 *   import { OfflineQueueSettingsSection } from "@/features/OfflineQueue";
 *   <OfflineQueueSettingsSection isOnline={isOnline} />
 */
export function OfflineQueueSettingsSection({ isOnline }) {
  const {
    pendingCount, failedCount,
    isSyncing, processQueue, retryFailed,
  } = useOfflineQueueContext();

  const [items, setItems] = useState([]);

  // Load pending + failed items for display
  useEffect(() => {
    let active = true;
    import("../services/queueService").then(({ getPendingItems }) => {
      getPendingItems().then((rows) => { if (active) setItems(rows); });
    });
    return () => { active = false; };
  }, [pendingCount, failedCount]);

  const total      = pendingCount + failedCount;
  const hasFailures= failedCount > 0;

  if (total === 0 && !isSyncing) return null;

  return (
    <section
      aria-labelledby="queue-section-heading"
      style={{
        fontFamily: "var(--font-sans, 'Public Sans', system-ui, sans-serif)",
        margin:     "0 0 24px",
      }}
    >
      {/* Section header */}
      <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2
          id="queue-section-heading"
          style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}
        >
          Offline Queue
        </h2>
        <PendingSyncBadge size="md" />
      </div>

      {/* Item list */}
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", border: `0.5px solid ${C.surfaceDim}`, margin: "0 12px" }}>
        {items.map((item, i) => {
          const label   = ACTION_LABELS[item.actionType];
          const isFailed= item.status === QUEUE_STATUS.FAILED;
          const accent  = isFailed ? C.earthRed : C.amber;
          const iconBg  = isFailed ? C.errorContainer : C.amberBg;

          return (
            <div
              key={item.id ?? i}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          12,
                padding:      "11px 14px",
                borderBottom: i < items.length - 1 ? `0.5px solid ${C.surfaceDim}` : "none",
              }}
            >
              {/* Action icon */}
              <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18, color: accent }}
                  aria-hidden="true"
                >
                  {label?.icon ?? "cloud_upload"}
                </span>
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.onSurface }}>
                  {label?.noun ?? item.actionType}
                </div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 1 }}>
                  {timeAgo(item.createdAt)}
                  {item.attempts > 0 && !isFailed && (
                    <span style={{ marginLeft: 6, color: C.amber }}>
                      · {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}
                    </span>
                  )}
                  {isFailed && (
                    <span style={{ marginLeft: 6, color: C.earthRed }}>
                      · Failed after {item.attempts} attempt{item.attempts !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Status chip */}
              <span
                style={{
                  fontSize:     10,
                  fontWeight:   700,
                  color:        isFailed ? C.earthRed : C.amber,
                  background:   isFailed ? C.errorContainer : C.amberBg,
                  padding:      "2px 8px",
                  borderRadius: 10,
                  flexShrink:   0,
                  textTransform:"uppercase",
                  letterSpacing:"0.04em",
                }}
              >
                {isFailed ? "Failed" : "Pending"}
              </span>
            </div>
          );
        })}

        {/* Syncing skeleton */}
        {isSyncing && items.length === 0 && (
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: C.secondary, animation: "sqs-spin 1s linear infinite" }}
              aria-hidden="true"
            >
              sync
            </span>
            <span style={{ fontSize: 13, color: C.textSecondary }}>Syncing…</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, padding: "10px 12px 0" }}>
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            onClick={processQueue}
            style={{
              flex: 1, padding: "10px 0",
              background: C.primary, color: "#fff",
              border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">cloud_upload</span>
            Sync Now
          </button>
        )}

        {hasFailures && (
          <button
            onClick={retryFailed}
            disabled={isSyncing}
            style={{
              flex: 1, padding: "10px 0",
              background: isSyncing ? "#E5E7EB" : C.errorContainer,
              color: isSyncing ? "#9CA3AF" : C.earthRed,
              border: `1px solid ${C.earthRed}44`,
              borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: isSyncing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }} aria-hidden="true">refresh</span>
            Retry Failed
          </button>
        )}
      </div>

      {!isOnline && (
        <p style={{ margin: "6px 16px 0", fontSize: 11, color: C.textSecondary, lineHeight: 1.5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }} aria-hidden="true">cloud_off</span>
          {" "}Items will sync automatically when you reconnect.
        </p>
      )}

      <style>{`@keyframes sqs-spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
