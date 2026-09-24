/**
 * supabase/functions/weekly-summary/index.ts
 *
 * Sends a personalised weekly recap push notification to every active user.
 *
 * Notification copy examples:
 *   "You earned 120 XP this week. Rank #52 → #48 🚀"
 *   "Great start! You earned 80 XP your first week. You're at Rank #71."
 *   "Keep pushing! You earned 45 XP but slipped to Rank #56."
 *
 * Trigger: Supabase Scheduled Function — set schedule "5 0 * * MON" in dashboard
 *          OR HTTP POST /functions/v1/weekly-summary (service role auth)
 *
 * Required secrets:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FCM_SERVER_KEY
 */

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeeklySummaryRow {
  user_id:       string;
  current_xp:    number;
  current_rank:  number;
  snapshot_xp:   number;
  snapshot_rank: number | null;
  xp_earned:     number;
  rank_change:   number; // positive = improved
}

// ─── Copy builder ─────────────────────────────────────────────────────────────

function buildCopy(row: WeeklySummaryRow): { title: string; body: string } | null {
  const { xp_earned, current_rank, snapshot_rank, rank_change } = row;
  if (xp_earned <= 0) return null;

  const xpLabel = xp_earned.toLocaleString("en-IN");

  if (snapshot_rank === null) {
    return {
      title: "Great start! 🌱",
      body:  `You earned ${xpLabel} XP your first week! You're at Rank #${current_rank}.`,
    };
  }
  if (rank_change > 0) {
    const e = rank_change >= 5 ? "🚀" : "📈";
    return {
      title: `You're climbing! ${e}`,
      body:  `You earned ${xpLabel} XP this week. Rank #${snapshot_rank} → #${current_rank} ${e}`,
    };
  }
  if (rank_change < 0) {
    return {
      title: "Keep pushing! 💪",
      body:  `You earned ${xpLabel} XP but slipped to Rank #${current_rank}. Get back to #${snapshot_rank}!`,
    };
  }
  return {
    title: "Solid week! ⭐",
    body:  `You earned ${xpLabel} XP and held Rank #${current_rank}. Keep it up!`,
  };
}

// ─── FCM send ─────────────────────────────────────────────────────────────────

async function sendFCM(token: string, title: string, body: string, data: Record<string,string>, key: string): Promise<boolean> {
  const res = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: { "Authorization": `key=${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: token,
      notification: { title, body, icon: "/icons/notification.png", click_action: "FLUTTER_NOTIFICATION_CLICK" },
      data: { type: "weekly_summary", ...data },
    }),
  });
  return res.ok;
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const fcmKey = Deno.env.get("FCM_SERVER_KEY");

    // Derive this week's Monday as the snapshot reference
    const now       = new Date();
    const daysBack  = now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1;
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - daysBack);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    console.log(`[weekly-summary] week_start=${weekStartStr}`);

    // Fetch weekly summary via RPC
    const { data: rows, error: rpcErr } = await supabase
      .rpc("get_weekly_summary", { p_week_start: weekStartStr });
    if (rpcErr) throw rpcErr;
    if (!rows?.length) {
      return new Response(JSON.stringify({ message: "No active users", sent: 0 }),
        { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // Fetch push tokens
    const userIds = (rows as WeeklySummaryRow[]).map((r) => r.user_id);
    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("user_id, token")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    const tokenMap = new Map<string, string>();
    for (const t of (tokenRows ?? []) as { user_id: string; token: string }[]) {
      if (!tokenMap.has(t.user_id)) tokenMap.set(t.user_id, t.token);
    }

    // Send notifications
    let totalSent = 0;
    for (const row of rows as WeeklySummaryRow[]) {
      const token = tokenMap.get(row.user_id);
      if (!token || !fcmKey) continue;
      const copy = buildCopy(row);
      if (!copy) continue;
      const ok = await sendFCM(token, copy.title, copy.body, {
        xp_earned:    String(row.xp_earned),
        current_rank: String(row.current_rank),
        rank_change:  String(row.rank_change),
      }, fcmKey);
      if (ok) totalSent++;
    }

    // Upsert snapshot for next week's reference
    const payload = (rows as WeeklySummaryRow[]).map((r) => ({
      user_id: r.user_id, week_start: weekStartStr,
      xp_at_start: r.current_xp, rank_at_start: r.current_rank,
    }));
    await supabase.from("weekly_xp_snapshots")
      .upsert(payload, { onConflict: "user_id,week_start", ignoreDuplicates: true });

    return new Response(
      JSON.stringify({ week_start: weekStartStr, users: rows.length, sent: totalSent }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[weekly-summary] error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
