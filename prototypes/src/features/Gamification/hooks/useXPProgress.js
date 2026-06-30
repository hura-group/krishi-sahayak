/**
 * hooks/useXPProgress.js
 *
 * Fetches the current user's XP, computes all tier-related derived values,
 * and subscribes to realtime XP updates so the profile bar animates live.
 *
 * Returns:
 *   xp            — total XP (number)
 *   tier          — current Tier object
 *   nextTier      — next Tier object (null if Champion)
 *   xpWithinTier  — XP earned inside current tier
 *   xpToNextTier  — XP still needed (0 if Champion)
 *   tierProgress  — 0–1 fraction within current tier
 *   overallProgress— 0–1 fraction across entire journey
 *   isLoading     — true on first fetch
 *   error         — fetch error or null
 *   refetch       — manual refetch trigger
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  getTierForXP,
  getNextTier,
  getXPWithinTier,
  getXPToNextTier,
  getTierProgress,
  getOverallProgress,
} from "../utils/tierUtils";

export function useXPProgress() {
  const [xp,        setXP]        = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);
  const channelRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchXP = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw authErr ?? new Error("Not authenticated");

      const { data, error: dbErr } = await supabase
        .from("user_profiles")
        .select("total_xp")
        .eq("user_id", user.id)
        .single();

      if (dbErr) throw dbErr;
      setXP(data?.total_xp ?? 0);
    } catch (err) {
      console.error("[useXPProgress] fetch error:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Realtime — update bar instantly when XP changes ───────────────────────

  useEffect(() => {
    fetchXP();

    let mounted = true;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channelRef.current = supabase
        .channel(`xp_progress:${user.id}`)
        .on(
          "postgres_changes",
          {
            event:  "UPDATE",
            schema: "public",
            table:  "user_profiles",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (!mounted) return;
            const newXP = payload.new?.total_xp;
            if (typeof newXP === "number") setXP(newXP);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchXP]);

  // ── Derived values ────────────────────────────────────────────────────────

  const tier            = getTierForXP(xp);
  const nextTier        = getNextTier(tier);
  const xpWithinTier    = getXPWithinTier(xp);
  const xpToNextTier    = getXPToNextTier(xp);
  const tierProgress    = getTierProgress(xp);
  const overallProgress = getOverallProgress(xp);

  return {
    xp,
    tier,
    nextTier,
    xpWithinTier,
    xpToNextTier,
    tierProgress,
    overallProgress,
    isLoading,
    error,
    refetch: fetchXP,
  };
}
