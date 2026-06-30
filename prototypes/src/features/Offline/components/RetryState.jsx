/**
 * src/features/Offline/components/RetryState.jsx
 *
 * Full-section error state shown when a data fetch fails (offline or server error).
 * NOT a "no data" empty state — it is always actionable with a Retry button.
 *
 * Features:
 *   • Contextual icon + title + description
 *   • RETRY button with spinner during retry attempt
 *   • Exponential back-off counter shown to user ("Retry in 8 s")
 *   • "Give up" state after MAX_ATTEMPTS (shows support link)
 *   • Offline-specific vs server-error messaging
 *
 * Usage:
 *   <RetryState
 *     type="weather"
 *     isOffline={isOffline}
 *     onRetry={fetchWeather}
 *   />
 *
 * @param {{
 *   type?:         "weather" | "market" | "crop" | "generic",
 *   isOffline?:    boolean,
 *   onRetry?:      () => Promise<void>,
 *   title?:        string,
 *   description?:  string,
 * }} props
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { OFFLINE_CONFIG, OFFLINE_COLORS } from "../constants/offlineConfig";

// ─── Content config per type ──────────────────────────────────────────────────

const CONTENT = {
  weather: {
    icon:        "sync_problem",
    title:       "Could Not Update Weather",
    description: "We need an internet connection to fetch real-time forecasts for your area.",
    offlineDesc: "Weather data requires an active connection. Connect to Wi-Fi or mobile data and retry.",
  },
  market: {
    icon:        "store_mall_directory",
    title:       "Market Prices Unavailable",
    description: "Unable to fetch the latest mandi prices. Showing cached data below.",
    offlineDesc: "Live mandi prices need a connection. Prices shown below are from your last sync.",
  },
  crop: {
    icon:        "agriculture",
    title:       "Crop Data Sync Failed",
    description: "Your crop information couldn't be updated from the server.",
    offlineDesc: "Crop data will sync automatically when you reconnect.",
  },
  generic: {
    icon:        "cloud_off",
    title:       "Could Not Load Data",
    description: "Something went wrong. Please check your connection and try again.",
    offlineDesc: "No internet connection. Data will load automatically when you reconnect.",
  },
};

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(seconds) {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (seconds <= 0) return;
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1_000);
    return () => clearInterval(interval);
  }, [seconds]);
  return remaining;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function RetryState({
  type        = "generic",
  isOffline   = false,
  onRetry,
  title,
  description,
}) {
  const content = CONTENT[type] ?? CONTENT.generic;

  const [isRetrying,   setIsRetrying]   = useState(false);
  const [attempts,     setAttempts]     = useState(0);
  const [cooldownSecs, setCooldownSecs] = useState(0);

  const cooldownRemaining = useCountdown(cooldownSecs);
  const isCoolingDown     = cooldownRemaining > 0;
  const gaveUp            = attempts >= OFFLINE_CONFIG.RETRY_MAX_ATTEMPTS;

  const handleRetry = useCallback(async () => {
    if (isRetrying || isCoolingDown || gaveUp) return;
    setIsRetrying(true);
    try {
      await onRetry?.();
      setAttempts(0);      // success — reset
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      // Exponential back-off: 1 s, 2 s, 4 s
      if (next < OFFLINE_CONFIG.RETRY_MAX_ATTEMPTS) {
        setCooldownSecs(
          Math.pow(2, next - 1) * (OFFLINE_CONFIG.RETRY_BACKOFF_BASE_MS / 1_000)
        );
      }
    } finally {
      setIsRetrying(false);
    }
  }, [isRetrying, isCoolingDown, gaveUp, onRetry, attempts]);

  const displayTitle = title ?? content.title;
  const displayDesc  = description ?? (isOffline ? content.offlineDesc : content.description);

  return (
    <div
      role="region"
      aria-label={`${displayTitle} — error state`}
      style={{
        background:    `${OFFLINE_COLORS.errorContainer}33`,
        border:        `2px dashed ${OFFLINE_COLORS.error}44`,
        borderRadius:  18,
        padding:       "32px 20px",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        textAlign:     "center",
        gap:           16,
      }}
    >
      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width:          64,
          height:         64,
          borderRadius:   "50%",
          background:     OFFLINE_COLORS.errorContainer,
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 30, color: OFFLINE_COLORS.onErrorContainer }}
        >
          {content.icon}
        </span>
      </div>

      {/* Text */}
      <div style={{ maxWidth: 280 }}>
        <h3
          style={{
            margin:     "0 0 6px",
            fontSize:   17,
            fontWeight: 700,
            color:      OFFLINE_COLORS.onErrorContainer,
            lineHeight: 1.3,
          }}
        >
          {displayTitle}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: OFFLINE_COLORS.onSurface, lineHeight: 1.6, opacity: 0.8 }}>
          {displayDesc}
        </p>
      </div>

      {/* Attempt counter */}
      {attempts > 0 && !gaveUp && (
        <p
          aria-live="polite"
          style={{ margin: 0, fontSize: 11, color: OFFLINE_COLORS.onSurface, opacity: 0.6 }}
        >
          Attempt {attempts} of {OFFLINE_CONFIG.RETRY_MAX_ATTEMPTS} failed
        </p>
      )}

      {/* Retry button */}
      {!gaveUp ? (
        <button
          onClick={handleRetry}
          disabled={isRetrying || isCoolingDown}
          aria-label={
            isRetrying ? "Retrying…" :
            isCoolingDown ? `Retry in ${cooldownRemaining} seconds` :
            "Retry"
          }
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            8,
            padding:        "12px 28px",
            background:     isRetrying || isCoolingDown
              ? `${OFFLINE_COLORS.error}66`
              : OFFLINE_COLORS.error,
            color:          "#fff",
            border:         "none",
            borderRadius:   999,
            fontSize:       14,
            fontWeight:     700,
            cursor:         isRetrying || isCoolingDown ? "not-allowed" : "pointer",
            letterSpacing:  "0.04em",
            transition:     "all 0.2s",
            boxShadow:      isRetrying || isCoolingDown
              ? "none"
              : "0 4px 14px rgba(121,86,75,0.35)",
          }}
        >
          <span
            className="material-symbols-outlined"
            aria-hidden="true"
            style={{
              fontSize:  18,
              animation: isRetrying ? "spin 1s linear infinite" : "none",
            }}
          >
            {isRetrying ? "sync" : "refresh"}
          </span>
          {isRetrying
            ? "Retrying…"
            : isCoolingDown
            ? `Retry in ${cooldownRemaining} s`
            : "Retry"}
        </button>
      ) : (
        /* Give-up state */
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: OFFLINE_COLORS.error, fontWeight: 600 }}>
            Still not working after {OFFLINE_CONFIG.RETRY_MAX_ATTEMPTS} attempts.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setAttempts(0); setCooldownSecs(0); }}
              style={{
                padding:      "9px 20px",
                background:   "transparent",
                border:       `1px solid ${OFFLINE_COLORS.error}`,
                color:        OFFLINE_COLORS.error,
                borderRadius: 999,
                fontSize:     13,
                fontWeight:   600,
                cursor:       "pointer",
              }}
            >
              Try Again
            </button>
            <a
              href="mailto:support@kisansathi.in"
              style={{
                padding:        "9px 20px",
                background:     OFFLINE_COLORS.error,
                color:          "#fff",
                borderRadius:   999,
                fontSize:       13,
                fontWeight:     600,
                textDecoration: "none",
              }}
            >
              Contact Support
            </a>
          </div>
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
