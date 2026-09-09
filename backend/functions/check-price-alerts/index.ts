// Supabase Edge Function: check-price-alerts
// Triggered by: POST /functions/v1/check-price-alerts
// Called from: marketRefreshService after every price fetch
// Uses service role key to bypass RLS when writing alert_history

import { serve } from 'https://deno.land/std@1.0.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const EXPO_PUSH_URL   = 'https://exp.host/--/api/v2/push/send';

// 1 hour cooldown — don't spam the same alert repeatedly
const COOLDOWN_MINUTES = 60;

interface PriceAlert {
  id: string;
  user_id: string;
  crop_name: string;
  state: string;
  condition: 'above' | 'below';
  target_price_per_qtl: number;
  last_triggered_at: string | null;
}

interface MarketPrice {
  crop_name: string;
  state: string;
  price_per_kg: number;
  recorded_at: string;
}

interface PushToken {
  user_id: string;
  token: string;
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    // ── 1. Load all active alerts ──────────────────────────────
    const { data: alerts, error: alertsErr } = await supabase
      .from('price_alerts')
      .select('id, user_id, crop_name, state, condition, target_price_per_qtl, last_triggered_at')
      .eq('is_active', true);

    if (alertsErr) throw alertsErr;
    if (!alerts || alerts.length === 0) {
      return json({ message: 'No active alerts', checked: 0, triggered: 0 });
    }

    // ── 2. Load latest price per crop+state (one DB call) ──────
    // Build unique crop+state pairs to minimise queries
    const pairs = [...new Set(alerts.map((a: PriceAlert) => `${a.crop_name}||${a.state}`))];

    const latestPrices: Record<string, number> = {};

    for (const pair of pairs) {
      const [crop, state] = pair.split('||');
      const { data } = await supabase
        .from('market_prices')
        .select('price_per_kg, recorded_at')
        .eq('crop_name', crop)
        .eq('state', state)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        // Convert kg → quintal (100 kg)
        latestPrices[pair] = parseFloat((data.price_per_kg * 100).toFixed(2));
      }
    }

    // ── 3. Evaluate each alert ─────────────────────────────────
    const now = new Date();
    const triggered: string[] = [];

    for (const alert of alerts as PriceAlert[]) {
      const key = `${alert.crop_name}||${alert.state}`;
      const currentPrice = latestPrices[key];
      if (currentPrice == null) continue;

      // Cooldown check — skip if triggered within last COOLDOWN_MINUTES
      if (alert.last_triggered_at) {
        const lastMs = new Date(alert.last_triggered_at).getTime();
        const diffMin = (now.getTime() - lastMs) / 1000 / 60;
        if (diffMin < COOLDOWN_MINUTES) continue;
      }

      const conditionMet =
        (alert.condition === 'above' && currentPrice > alert.target_price_per_qtl) ||
        (alert.condition === 'below' && currentPrice < alert.target_price_per_qtl);

      if (!conditionMet) continue;

      // ── 3a. Insert history record ────────────────────────────
      await supabase.from('alert_history').insert({
        alert_id:                alert.id,
        user_id:                 alert.user_id,
        crop_name:               alert.crop_name,
        state:                   alert.state,
        condition:               alert.condition,
        target_price_per_qtl:    alert.target_price_per_qtl,
        triggered_price_per_qtl: currentPrice,
        triggered_at:            now.toISOString(),
      });

      // ── 3b. Update last_triggered_at on the alert ────────────
      await supabase
        .from('price_alerts')
        .update({ last_triggered_at: now.toISOString() })
        .eq('id', alert.id);

      triggered.push(alert.id);

      // ── 3c. Send push notification ───────────────────────────
      const { data: tokenRows } = await supabase
        .from('push_tokens')
        .select('token')
        .eq('user_id', alert.user_id);

      if (!tokenRows || tokenRows.length === 0) continue;

      const symbol   = alert.condition === 'above' ? '▲' : '▼';
      const verb     = alert.condition === 'above' ? 'crossed above' : 'dropped below';
      const title    = `🌾 Price Alert: ${alert.crop_name}`;
      const body     = `${alert.crop_name} ${verb} ₹${alert.target_price_per_qtl}/qtl — now at ₹${currentPrice}/qtl ${symbol}`;

      const messages = (tokenRows as PushToken[]).map(({ token }) => ({
        to:    token,
        sound: 'default',
        title,
        body,
        data: {
          type:       'price_alert',
          alert_id:   alert.id,
          crop_name:  alert.crop_name,
          state:      alert.state,
          condition:  alert.condition,
          target:     alert.target_price_per_qtl,
          current:    currentPrice,
        },
        priority:   'high',
        channelId:  'price-alerts',
      }));

      // Expo push API accepts batches of up to 100
      await fetch(EXPO_PUSH_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify(messages),
      });
    }

    return json({ message: 'Done', checked: alerts.length, triggered: triggered.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});

function json(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
