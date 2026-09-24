/**
 * supabase/functions/price-alert/index.ts
 *
 * Triggered by a Supabase Database Webhook when a row is inserted into
 * `commodity_prices` (real-time mandi price feed).
 *
 * Flow:
 *   1. Parse the new price record from the webhook payload
 *   2. Find users who have a price alert set for this commodity + mandi
 *      AND whose threshold has been crossed by this price update
 *   3. Run the notification preference filter (don't send if type disabled)
 *   4. Check quiet hours for each user's timezone
 *   5. Send FCM push notifications to eligible users
 *   6. Log each notification in `notification_logs`
 *
 * Webhook config (Supabase Dashboard → Database → Webhooks):
 *   Table:  commodity_prices
 *   Event:  INSERT
 *   Method: POST
 *   URL:    https://<project>.supabase.co/functions/v1/price-alert
 *
 * Environment variables:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FCM_SERVER_KEY
 */

import { serve }        from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PriceRecord {
  id:           string;
  commodity_id: string;
  commodity:    string;   // e.g. "wheat"
  mandi_id:     string;
  mandi_name:   string;
  price:        number;   // ₹ per quintal
  unit:         string;
  recorded_at:  string;
}

interface PriceAlert {
  user_id:          string;
  commodity_id:     string;
  threshold_price:  number;
  direction:        "above" | "below";   // alert when price crosses this way
  fcm_token:        string | null;
  quiet_hours_enabled: boolean;
  quiet_start:      string;
  quiet_end:        string;
  timezone:         string;
  price_alerts_enabled: boolean;
}

// ─── Quiet hours helper ───────────────────────────────────────────────────────

function getLocalMinutes(timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === "hour")?.value   ?? "0", 10);
  const m = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  return h * 60 + m;
}

function isInQuietHours(start: string, end: string, timezone: string): boolean {
  const toMins = (t: string) => { const [h,m] = t.split(":").map(Number); return h*60+m; };
  const now = getLocalMinutes(timezone);
  const s   = toMins(start);
  const e   = toMins(end);
  return s > e ? (now >= s || now < e) : (now >= s && now < e);
}

// ─── FCM helper ───────────────────────────────────────────────────────────────

async function sendFCM(
  token: string,
  title: string,
  body:  string,
  data:  Record<string, string>,
  fcmKey: string,
): Promise<boolean> {
  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method:  "POST",
      headers: { "Authorization": `key=${fcmKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        notification: { title, body, sound: "default", click_action: "FLUTTER_NOTIFICATION_CLICK" },
        data: { type: "price_alert", ...data },
        priority: "high",
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Notification copy ────────────────────────────────────────────────────────

function buildCopy(alert: PriceAlert, record: PriceRecord): { title: string; body: string } {
  const fmt = (n: number) => new Intl.NumberFormat("en-IN").format(Math.round(n));
  const direction = alert.direction === "above" ? "risen above" : "fallen below";
  return {
    title: `📊 ${record.commodity} Price Alert`,
    body:  `${record.commodity} at ${record.mandi_name} is ₹${fmt(record.price)}/q — ${direction} your ₹${fmt(alert.threshold_price)} threshold.`,
  };
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const payload  = await req.json();
    const record   = (payload.record ?? payload.new) as PriceRecord;

    if (!record?.commodity_id || !record?.price) {
      return new Response(JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const fcmKey = Deno.env.get("FCM_SERVER_KEY") ?? "";

    // ── 1. Find eligible alerts for this commodity ──────────────────────────
    const { data: alerts, error: alertErr } = await supabase
      .from("price_alerts")
      .select(`
        user_id, commodity_id, threshold_price, direction,
        push_tokens!inner(token),
        user_notification_preferences!inner(
          price_alerts_enabled:price_alerts,
          quiet_hours_enabled,
          quiet_start, quiet_end, timezone
        )
      `)
      .eq("commodity_id", record.commodity_id)
      .eq("active", true);

    if (alertErr) throw alertErr;
    if (!alerts?.length) {
      return new Response(JSON.stringify({ sent: 0, reason: "no_alerts_configured" }),
        { headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // ── 2. Filter + send ────────────────────────────────────────────────────
    const notifLogs: object[] = [];
    let sentCount = 0;

    for (const alert of alerts) {
      const prefs = alert.user_notification_preferences;
      const token = alert.push_tokens?.token;

      // Gate 1: preference check
      if (!prefs?.price_alerts_enabled) {
        notifLogs.push({ user_id: alert.user_id, type: "price_alert", status: "skipped_preference", commodity_id: record.commodity_id });
        continue;
      }

      // Gate 2: threshold direction check
      const crossed = alert.direction === "above"
        ? record.price >= alert.threshold_price
        : record.price <= alert.threshold_price;
      if (!crossed) continue;

      // Gate 3: quiet hours
      if (prefs.quiet_hours_enabled && isInQuietHours(prefs.quiet_start, prefs.quiet_end, prefs.timezone ?? "Asia/Kolkata")) {
        notifLogs.push({ user_id: alert.user_id, type: "price_alert", status: "skipped_quiet_hours", commodity_id: record.commodity_id });
        continue;
      }

      // Gate 4: FCM token exists
      if (!token || !fcmKey) {
        notifLogs.push({ user_id: alert.user_id, type: "price_alert", status: "skipped_no_token", commodity_id: record.commodity_id });
        continue;
      }

      // Send
      const copy = buildCopy(alert as PriceAlert, record);
      const ok = await sendFCM(token, copy.title, copy.body, {
        commodity_id: record.commodity_id,
        commodity:    record.commodity,
        mandi_id:     record.mandi_id,
        price:        String(record.price),
      }, fcmKey);

      sentCount += ok ? 1 : 0;
      notifLogs.push({
        user_id:      alert.user_id,
        type:         "price_alert",
        status:       ok ? "sent" : "fcm_failed",
        commodity_id: record.commodity_id,
        fcm_token:    token.slice(0, 8) + "...",   // truncated for logging
        sent_at:      new Date().toISOString(),
      });
    }

    // ── 3. Persist notification log ─────────────────────────────────────────
    if (notifLogs.length) {
      await supabase.from("notification_logs").insert(notifLogs);
    }

    return new Response(
      JSON.stringify({ sent: sentCount, total_checked: alerts.length }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[price-alert]", err);
    return new Response(JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
