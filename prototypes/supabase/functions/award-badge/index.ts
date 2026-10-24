/**
 * supabase/functions/award-badge/index.ts
 *
 * Supabase Edge Function — checks badge criteria and awards badges.
 *
 * Triggered by:  POST /functions/v1/award-badge
 * Caller:        badgeChecker.js (client util) after every relevant user action
 *
 * Request body:
 *   { userId: string, action: string, metadata?: Record<string, unknown> }
 *
 * Response body:
 *   { awarded: Badge[] }   — list of newly awarded badges (empty if none)
 *
 * Environment variables required (set in Supabase dashboard → Functions → Secrets):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   FCM_SERVER_KEY            ← Firebase Cloud Messaging server key for push notifications
 *   APP_LAUNCH_DATE           ← ISO date string, e.g. "2026-04-15" (for Early Bird badge)
 */

import { serve }          from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient }   from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestPayload {
  userId:   string;
  action:   string;
  metadata?: Record<string, unknown>;
}

interface BadgeRow {
  id:         string;
  slug:       string;
  name:       string;
  description: string;
  icon:       string;
  color:      string;
  bg_color:   string;
  xp_reward:  number;
}

type CriteriaFn = (
  supabase:  ReturnType<typeof createClient>,
  userId:    string,
  metadata?: Record<string, unknown>
) => Promise<boolean>;

// ─── Badge criteria functions ─────────────────────────────────────────────────
//
// Each function receives the Supabase admin client, the userId, and optional
// action metadata. Returns true if the user now qualifies for that badge.
// Keep queries minimal — they run on every relevant user action.

const CRITERIA: Record<string, CriteriaFn> = {
  // ── Farming ──────────────────────────────────────────────────────────────

  "first-scan": async (sb, uid) => {
    const { count } = await sb
      .from("scan_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 1;
  },

  "weather-wise": async (sb, uid) => {
    const { count } = await sb
      .from("weather_check_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 5;
  },

  "harvest-hero": async (sb, uid) => {
    const { count } = await sb
      .from("harvest_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 1;
  },

  "crop-master": async (sb, uid) => {
    // Count distinct crop types added by this user
    const { data } = await sb
      .from("user_crops")
      .select("crop_type")
      .eq("user_id", uid);
    const uniqueCrops = new Set((data ?? []).map((r: { crop_type: string }) => r.crop_type));
    return uniqueCrops.size >= 5;
  },

  // ── Market ────────────────────────────────────────────────────────────────

  "market-watcher": async (sb, uid) => {
    const { count } = await sb
      .from("market_view_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 10;
  },

  "top-seller": async (sb, uid) => {
    const { count } = await sb
      .from("product_listings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 1;
  },

  "price-prophet": async (sb, uid, meta) => {
    // metadata must include: { salePrice, predictedPeak }
    const salePrice     = meta?.salePrice     as number | undefined;
    const predictedPeak = meta?.predictedPeak as number | undefined;
    if (!salePrice || !predictedPeak || predictedPeak <= 0) return false;
    const ratio = salePrice / predictedPeak;
    return ratio >= 0.9 && ratio <= 1.1;
  },

  // ── Social ────────────────────────────────────────────────────────────────

  "community-champion": async (sb, uid) => {
    const { count } = await sb
      .from("community_posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 5;
  },

  "social-butterfly": async (sb, uid) => {
    const { count } = await sb
      .from("farmer_connections")
      .select("id", { count: "exact", head: true })
      .or(`user_id.eq.${uid},connected_user_id.eq.${uid}`);
    return (count ?? 0) >= 10;
  },

  // ── Learning ─────────────────────────────────────────────────────────────

  "knowledge-seeker": async (sb, uid) => {
    const { count } = await sb
      .from("article_read_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid);
    return (count ?? 0) >= 10;
  },

  // ── Milestones ────────────────────────────────────────────────────────────

  "green-streak": async (sb, uid) => {
    const { data } = await sb
      .from("user_profiles")
      .select("current_streak")
      .eq("user_id", uid)
      .single();
    return (data?.current_streak ?? 0) >= 7;
  },

  "early-bird": async (_sb, _uid) => {
    const launchDateStr = Deno.env.get("APP_LAUNCH_DATE") ?? "2026-04-15";
    const launchDate    = new Date(launchDateStr);
    const deadline      = new Date(launchDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    // The user_id was created before the 30-day window closed.
    // We compare against NOW() so this badge can only be awarded once during that window.
    return new Date() <= deadline;
  },

  "digital-farmer": async (sb, uid) => {
    const { data } = await sb
      .from("user_profiles")
      .select("profile_completeness")
      .eq("user_id", uid)
      .single();
    return (data?.profile_completeness ?? 0) >= 100;
  },

  "milestone-maker": async (sb, uid) => {
    const { data } = await sb
      .from("user_profiles")
      .select("total_xp")
      .eq("user_id", uid)
      .single();
    return (data?.total_xp ?? 0) >= 1000;
  },

  "legend": async (sb, uid) => {
    // Re-compute weekly rank on demand (or read from a pre-computed rank cache)
    const { data } = await sb
      .from("user_profiles")
      .select("user_id, total_xp")
      .order("total_xp", { ascending: false })
      .limit(10);
    return (data ?? []).some((r: { user_id: string }) => r.user_id === uid);
  },
};

// ─── Action → Badge ids mapping ───────────────────────────────────────────────
// Tells the function which badges to check for each incoming action key.

const ACTION_TO_BADGES: Record<string, string[]> = {
  scan:                    ["first-scan"],
  market_view:             ["market-watcher"],
  community_post:          ["community-champion"],
  login_streak:            ["green-streak"],
  product_listed:          ["top-seller"],
  registration:            ["early-bird"],
  article_read:            ["knowledge-seeker"],
  weather_check:           ["weather-wise"],
  harvest_logged:          ["harvest-hero"],
  sale_completed:          ["price-prophet"],
  farmer_connected:        ["social-butterfly"],
  crop_added:              ["crop-master"],
  profile_updated:         ["digital-farmer"],
  xp_milestone:            ["milestone-maker"],
  leaderboard_rank_updated:["legend"],
};

// ─── Push notification helper ──────────────────────────────────────────────────

async function sendPushNotification(
  supabase: ReturnType<typeof createClient>,
  userId:   string,
  badge:    BadgeRow,
): Promise<void> {
  // 1. Fetch the user's FCM push token from the push_tokens table
  const { data: tokenRow } = await supabase
    .from("push_tokens")
    .select("token")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!tokenRow?.token) return; // user has no push token — skip silently

  const fcmKey = Deno.env.get("FCM_SERVER_KEY");
  if (!fcmKey) {
    console.warn("[award-badge] FCM_SERVER_KEY not set — skipping push notification");
    return;
  }

  // 2. Send via FCM REST API (v1)
  await fetch("https://fcm.googleapis.com/fcm/send", {
    method:  "POST",
    headers: {
      "Authorization": `key=${fcmKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      to: tokenRow.token,
      notification: {
        title: "🏅 New Badge Earned!",
        body:  `You just unlocked "${badge.name}" — +${badge.xp_reward} XP`,
        icon:  "/icons/badge-notification.png",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      data: {
        type:     "badge_earned",
        badge_id: badge.id,
        badge_slug: badge.slug,
      },
    }),
  });
}

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // ── 1. Parse and validate request ───────────────────────────────────────
    const { userId, action, metadata }: RequestPayload = await req.json();

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: "userId and action are required" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── 2. Initialise Supabase admin client ──────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 3. Resolve candidate badge ids for this action ───────────────────────
    const candidateIds = ACTION_TO_BADGES[action] ?? [];
    if (candidateIds.length === 0) {
      return new Response(
        JSON.stringify({ awarded: [] }),
        { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // ── 4. Fetch already-earned badge slugs for this user ────────────────────
    const { data: earnedRows, error: earnedErr } = await supabase
      .from("user_badges")
      .select("badge_id, badges(slug)")
      .eq("user_id", userId);

    if (earnedErr) throw earnedErr;

    const earnedSlugs = new Set<string>(
      (earnedRows ?? []).map((r: { badges: { slug: string } }) => r.badges.slug)
    );

    // ── 5. Fetch badge metadata for candidates ───────────────────────────────
    const { data: badgeRows, error: badgeErr } = await supabase
      .from("badges")
      .select("id, slug, name, description, icon, color, bg_color, xp_reward")
      .in("slug", candidateIds);

    if (badgeErr) throw badgeErr;

    // ── 6. Check criteria and award ──────────────────────────────────────────
    const newlyAwarded: BadgeRow[] = [];

    for (const badge of (badgeRows ?? []) as BadgeRow[]) {
      // Skip if already earned
      if (earnedSlugs.has(badge.slug)) continue;

      // Run criteria check
      const criteriaFn = CRITERIA[badge.slug];
      if (!criteriaFn) {
        console.warn(`[award-badge] No criteria function for badge: ${badge.slug}`);
        continue;
      }

      const qualifies = await criteriaFn(supabase, userId, metadata);
      if (!qualifies) continue;

      // ── Award the badge ────────────────────────────────────────────────────
      const { error: insertErr } = await supabase
        .from("user_badges")
        .insert({ user_id: userId, badge_id: badge.id });

      if (insertErr) {
        // UNIQUE constraint violation means a concurrent request already awarded it — safe to skip
        if (insertErr.code === "23505") continue;
        throw insertErr;
      }

      // ── Award XP ──────────────────────────────────────────────────────────
      const { error: xpErr } = await supabase.rpc("increment_user_xp", {
        p_user_id: userId,
        p_amount:  badge.xp_reward,
      });
      if (xpErr) console.error(`[award-badge] XP increment failed for ${badge.slug}:`, xpErr);

      // ── Push notification ─────────────────────────────────────────────────
      try {
        await sendPushNotification(supabase, userId, badge);
      } catch (pushErr) {
        // Non-fatal — badge is still awarded even if notification fails
        console.error(`[award-badge] Push failed for ${badge.slug}:`, pushErr);
      }

      newlyAwarded.push(badge);
      console.log(`[award-badge] Awarded "${badge.slug}" to user ${userId}`);
    }

    // ── 7. Return awarded badges ─────────────────────────────────────────────
    return new Response(
      JSON.stringify({ awarded: newlyAwarded }),
      { headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[award-badge] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
