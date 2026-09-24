/**
 * hooks/useBadges.js
 *
 * Fetches all badge definitions and the current user's earned badges,
 * merges them into a single enriched list, and keeps it live via
 * a Supabase Realtime subscription.
 *
 * Returns:
 *   badges       — all 15 badges with earned: bool and earnedAt: Date|null
 *   earnedCount  — number of badges the user has earned
 *   isLoading    — true on first fetch
 *   error        — any fetch error, null otherwise
 *   refetch      — manual refetch function
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase"; // adjust to your Supabase client path

/**
 * @typedef {{
 *   id:            string,
 *   slug:          string,
 *   name:          string,
 *   description:   string,
 *   icon:          string,
 *   color:         string,
 *   bgColor:       string,
 *   xpReward:      number,
 *   category:      string,
 *   triggerAction: string,
 *   criteria:      string,
 *   earned:        boolean,
 *   earnedAt:      Date|null,
 * }} EnrichedBadge
 */

export function useBadges() {
  const [badges,    setBadges]    = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState(null);
  const channelRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchBadges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw authErr ?? new Error("Not authenticated");

      // 1. All badge definitions
      const { data: allBadges, error: badgeErr } = await supabase
        .from("badges")
        .select("id, slug, name, description, icon, color, bg_color, xp_reward, category, trigger_action, criteria")
        .order("created_at", { ascending: true });

      if (badgeErr) throw badgeErr;

      // 2. This user's earned badges
      const { data: userBadges, error: userBadgeErr } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", user.id);

      if (userBadgeErr) throw userBadgeErr;

      // 3. Build a lookup: badge_id → earned_at
      const earnedMap = new Map(
        (userBadges ?? []).map((ub) => [ub.badge_id, new Date(ub.earned_at)])
      );

      // 4. Merge
      const enriched = (allBadges ?? []).map((b) => ({
        id:            b.id,
        slug:          b.slug,
        name:          b.name,
        description:   b.description,
        icon:          b.icon,
        color:         b.color,
        bgColor:       b.bg_color,
        xpReward:      b.xp_reward,
        category:      b.category,
        triggerAction: b.trigger_action,
        criteria:      b.criteria,
        earned:        earnedMap.has(b.id),
        earnedAt:      earnedMap.get(b.id) ?? null,
      }));

      setBadges(enriched);
    } catch (err) {
      console.error("[useBadges] fetch error:", err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Realtime subscription ──────────────────────────────────────────────────
  // When the Edge Function inserts a new user_badge row, we get notified
  // here and refetch so the grid updates without a manual refresh.

  useEffect(() => {
    fetchBadges();

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channelRef.current = supabase
        .channel(`user_badges:${user.id}`)
        .on(
          "postgres_changes",
          {
            event:  "INSERT",
            schema: "public",
            table:  "user_badges",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // A new badge was just awarded — refetch to update the grid
            fetchBadges();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [fetchBadges]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const earnedCount = badges.filter((b) => b.earned).length;

  return { badges, earnedCount, isLoading, error, refetch: fetchBadges };
}
