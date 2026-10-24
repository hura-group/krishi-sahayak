/**
 * hooks/useBadgeNotification.js
 *
 * Listens for newly awarded badges (via Supabase Realtime) and
 * exposes the state needed to show the BadgeEarnedModal + confetti.
 *
 * Mount this hook once at the app root (e.g. inside your app's layout)
 * so it's always listening regardless of which screen the user is on.
 *
 * Usage:
 *   const { pendingBadge, dismissBadge } = useBadgeNotification();
 *
 *   return (
 *     <>
 *       <AppRoutes />
 *       {pendingBadge && (
 *         <BadgeEarnedModal badge={pendingBadge} onDismiss={dismissBadge} />
 *       )}
 *     </>
 *   );
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase"; // adjust to your Supabase client path

export function useBadgeNotification() {
  // The badge currently being celebrated (null = nothing to show)
  const [pendingBadge, setPendingBadge] = useState(null);

  // Queue for badges awarded in rapid succession so none are lost
  const queueRef   = useRef([]);
  const showingRef = useRef(false);
  const channelRef = useRef(null);

  // ── Queue helpers ──────────────────────────────────────────────────────────

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      showingRef.current = false;
      setPendingBadge(null);
      return;
    }
    showingRef.current = true;
    setPendingBadge(queueRef.current.shift());
  }, []);

  const enqueueBadge = useCallback((badge) => {
    queueRef.current.push(badge);
    if (!showingRef.current) showNext();
  }, [showNext]);

  /** Call this when the user taps "Awesome!" or the modal auto-dismisses */
  const dismissBadge = useCallback(() => {
    // Brief pause between badges so the confetti fades before the next modal appears
    setTimeout(showNext, 400);
  }, [showNext]);

  // ── Realtime subscription ──────────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      channelRef.current = supabase
        .channel(`badge_notification:${user.id}`)
        .on(
          "postgres_changes",
          {
            event:  "INSERT",
            schema: "public",
            table:  "user_badges",
            filter: `user_id=eq.${user.id}`,
          },
          async (payload) => {
            if (!mounted) return;

            // Fetch full badge details for the newly inserted row
            const { data: badge, error } = await supabase
              .from("badges")
              .select("id, slug, name, description, icon, color, bg_color, xp_reward")
              .eq("id", payload.new.badge_id)
              .single();

            if (error || !badge) {
              console.error("[useBadgeNotification] badge fetch error:", error);
              return;
            }

            enqueueBadge({
              id:          badge.id,
              slug:        badge.slug,
              name:        badge.name,
              description: badge.description,
              icon:        badge.icon,
              color:       badge.color,
              bgColor:     badge.bg_color,
              xpReward:    badge.xp_reward,
              earnedAt:    new Date(payload.new.earned_at),
            });
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      mounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [enqueueBadge]);

  return { pendingBadge, dismissBadge };
}
