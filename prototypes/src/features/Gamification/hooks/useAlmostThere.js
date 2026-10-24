/**
 * hooks/useAlmostThere.js
 *
 * Drives the AlmostThereBanner on the home screen.
 *
 * Checks two conditions on mount and after every relevant user action:
 *
 *   1. RANK nudge  — user is ≤ 10 XP behind the person ranked one above them
 *   2. TIER nudge  — user is ≤ 50 XP away from the next XP tier
 *
 * Rank nudge takes priority. Each nudge is dismissible for 24 hours
 * (stored in localStorage so it persists across refreshes).
 *
 * Returns:
 *   nudge         — { type, xpNeeded, targetLabel } | null
 *   isDismissed   — true if the user has dismissed it within 24 h
 *   dismiss       — call this when the user closes the banner
 *   recheckNudge  — call after an XP-earning action to refresh the check
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  ALMOST_THERE_RANK_XP_THRESHOLD,
  ALMOST_THERE_TIER_XP_THRESHOLD,
} from "../constants/tiers";
import { getXPToNextTier, getTierForXP, getNextTier } from "../utils/tierUtils";

const DISMISS_STORAGE_KEY = "gamification_almost_there_dismissed_at";
const DISMISS_TTL_MS      = 24 * 60 * 60 * 1000; // 24 hours

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadDismissedAt() {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    return raw ? parseInt(raw, 10) : null;
  } catch { return null; }
}

function isDismissedRecently() {
  const at = loadDismissedAt();
  if (!at) return false;
  return Date.now() - at < DISMISS_TTL_MS;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAlmostThere() {
  const [nudge,       setNudge]       = useState(null);
  const [isDismissed, setIsDismissed] = useState(isDismissedRecently);
  const [isChecking,  setIsChecking]  = useState(false);
  const mountedRef = useRef(true);

  // ── Core check ────────────────────────────────────────────────────────────

  const checkNudge = useCallback(async () => {
    if (isDismissedRecently()) {
      setIsDismissed(true);
      setNudge(null);
      return;
    }

    setIsChecking(true);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user || !mountedRef.current) return;

      // 1. Get current user XP and rank
      const { data: profile, error: profileErr } = await supabase
        .from("user_profiles")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();

      if (profileErr || !mountedRef.current) return;
      const totalXP = profile?.total_xp ?? 0;

      // ── Check 1: rank gap (calls Supabase RPC) ───────────────────────────
      const { data: rankData, error: rankErr } = await supabase
        .rpc("get_rank_xp_gap", { p_user_id: user.id });

      if (!rankErr && rankData?.[0] && mountedRef.current) {
        const { current_rank, xp_gap } = rankData[0];
        if (
          typeof xp_gap === "number" &&
          xp_gap > 0 &&
          xp_gap <= ALMOST_THERE_RANK_XP_THRESHOLD
        ) {
          setNudge({
            type:        "rank",
            xpNeeded:    xp_gap,
            targetLabel: `Rank #${current_rank - 1}`,
            currentRank: current_rank,
          });
          setIsDismissed(false);
          return; // rank nudge takes priority
        }
      }

      // ── Check 2: tier gap ─────────────────────────────────────────────────
      if (mountedRef.current) {
        const xpToNext = getXPToNextTier(totalXP);
        const nextTier = getNextTier(getTierForXP(totalXP));
        if (nextTier && xpToNext > 0 && xpToNext <= ALMOST_THERE_TIER_XP_THRESHOLD) {
          setNudge({
            type:        "tier",
            xpNeeded:    xpToNext,
            targetLabel: `${nextTier.name} tier`,
            nextTier,
          });
          setIsDismissed(false);
          return;
        }
      }

      // No nudge condition met
      if (mountedRef.current) setNudge(null);

    } catch (err) {
      console.error("[useAlmostThere] check error:", err);
    } finally {
      if (mountedRef.current) setIsChecking(false);
    }
  }, []); // stable — no deps that change

  // ── Dismiss ───────────────────────────────────────────────────────────────

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch { /* ignore storage errors */ }
    setIsDismissed(true);
    setNudge(null);
  }, []);

  // ── Mount check ───────────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    checkNudge();
    return () => { mountedRef.current = false; };
  }, [checkNudge]);

  return {
    nudge,
    isDismissed,
    isChecking,
    dismiss,
    recheckNudge: checkNudge,
  };
}
