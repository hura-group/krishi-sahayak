/**
 * src/features/Offline/hooks/useNetworkStatus.js
 *
 * Monitors network connectivity and provides derived state for
 * the entire Offline Indicator UI system.
 *
 * Approach (layered for reliability):
 *   1. `navigator.onLine`          — immediate browser flag
 *   2. `online` / `offline` events — browser connectivity events
 *   3. Lightweight ping poll       — confirms actual internet (not just LAN)
 *
 * Returns:
 *   isOnline        — true when connectivity is confirmed
 *   isOffline       — !isOnline (convenience)
 *   justCameOnline  — true for one render cycle after reconnection
 *                     (used to trigger the sync toast)
 *   connectionType  — "4g" | "3g" | "2g" | "slow-2g" | "wifi" | "unknown"
 *   lastOnlineAt    — Date of last confirmed connection
 *   checkNow        — manually trigger a connectivity check
 *
 * React Native: swap `window.addEventListener` for
 *   `NetInfo.addEventListener` from @react-native-community/netinfo.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  OFFLINE_CONFIG,
  OFFLINE_COLORS,
} from "../constants/offlineConfig";

// ─── Ping helper ──────────────────────────────────────────────────────────────

/**
 * Pings a lightweight endpoint to verify actual internet access.
 * Returns true if the ping succeeds within 5 s.
 */
async function pingConnectivity(url = OFFLINE_CONFIG.CONNECTIVITY_PING_URL) {
  try {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(url, {
      method:  "HEAD",
      cache:   "no-store",
      signal:  controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

// ─── Connection type helper ───────────────────────────────────────────────────

function getConnectionType() {
  if (typeof navigator === "undefined") return "unknown";
  const conn =
    (navigator).connection ??
    (navigator).mozConnection ??
    (navigator).webkitConnection;
  return conn?.effectiveType ?? conn?.type ?? "unknown";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNetworkStatus({ pingUrl } = {}) {
  const initialOnline =
    typeof navigator !== "undefined" ? navigator.onLine : true;

  const [isOnline,       setIsOnline]       = useState(initialOnline);
  const [justCameOnline, setJustCameOnline] = useState(false);
  const [connectionType, setConnectionType] = useState(getConnectionType);
  const [lastOnlineAt,   setLastOnlineAt]   = useState(
    initialOnline ? new Date() : null
  );

  // Track previous value to detect transitions
  const prevOnlineRef     = useRef(initialOnline);
  const pollTimerRef      = useRef(null);
  const bannerDelayRef    = useRef(null);
  const justCameTimerRef  = useRef(null);

  // ── Core update function ──────────────────────────────────────────────────

  const setOnlineState = useCallback((online) => {
    const wasOnline = prevOnlineRef.current;
    prevOnlineRef.current = online;

    setIsOnline(online);
    setConnectionType(getConnectionType());

    if (online) {
      setLastOnlineAt(new Date());
      if (!wasOnline) {
        // Transitioned offline → online: trigger "just came online" for one cycle
        setJustCameOnline(true);
        clearTimeout(justCameTimerRef.current);
        justCameTimerRef.current = setTimeout(() => setJustCameOnline(false), 500);
      }
    }
  }, []);

  // ── Manual check ─────────────────────────────────────────────────────────

  const checkNow = useCallback(async () => {
    const reachable = await pingConnectivity(
      pingUrl ?? OFFLINE_CONFIG.CONNECTIVITY_PING_URL
    );
    setOnlineState(reachable);
    return reachable;
  }, [pingUrl, setOnlineState]);

  // ── Browser event listeners ───────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      // Don't trust the event alone — ping to confirm real internet
      clearTimeout(bannerDelayRef.current);
      checkNow();
    };

    const handleOffline = () => {
      // Debounce offline state slightly to avoid flickering on poor connections
      bannerDelayRef.current = setTimeout(() => {
        setOnlineState(false);
      }, OFFLINE_CONFIG.BANNER_SHOW_DELAY_MS);
    };

    window.addEventListener("online",  handleOnline,  { passive: true });
    window.addEventListener("offline", handleOffline, { passive: true });

    // Listen for connection type changes (e.g. 4G → 2G)
    const conn = (navigator).connection ??
                 (navigator).mozConnection ??
                 (navigator).webkitConnection;
    conn?.addEventListener("change", () => setConnectionType(getConnectionType()));

    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
      conn?.removeEventListener("change",   () => {});
    };
  }, [checkNow, setOnlineState]);

  // ── Periodic ping poll ────────────────────────────────────────────────────

  useEffect(() => {
    // Only poll when the browser thinks we're online — to catch "connected but
    // no internet" scenarios (hotel Wi-Fi captive portals, etc.)
    if (!isOnline) return;

    pollTimerRef.current = setInterval(checkNow, OFFLINE_CONFIG.CONNECTIVITY_POLL_MS);
    return () => clearInterval(pollTimerRef.current);
  }, [isOnline, checkNow]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────

  useEffect(() => () => {
    clearTimeout(bannerDelayRef.current);
    clearTimeout(justCameTimerRef.current);
    clearInterval(pollTimerRef.current);
  }, []);

  return {
    isOnline,
    isOffline:      !isOnline,
    justCameOnline,
    connectionType,
    lastOnlineAt,
    checkNow,
  };
}
