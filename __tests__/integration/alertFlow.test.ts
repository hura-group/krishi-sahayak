/**
 * integration/alertFlow.test.ts
 *
 * Simulates the full check-price-alerts edge function flow end-to-end
 * without any real network I/O:
 *
 *   1. Load active alerts from DB
 *   2. Fetch latest price per crop+state
 *   3. Evaluate each alert (condition, cooldown)
 *   4. Insert alert_history record
 *   5. Update last_triggered_at
 *   6. Send push notification (mocked fetch)
 *
 * Every Supabase table call is intercepted and controlled via
 * a per-table mock map, so we can assert exactly which inserts/updates
 * fired and with what payload.
 */

import { evaluateAlert, kgToQtl } from '../../apps/mobile/src/utils/alertEvaluator';
import { FIXTURE_ALERTS, FIXTURE_LATEST_PRICES } from '../fixtures';

// ─── Types ────────────────────────────────────────────────────

interface HistoryInsert {
  alert_id:                string;
  user_id:                 string;
  crop_name:               string;
  state:                   string;
  condition:               string;
  target_price_per_qtl:    number;
  triggered_price_per_qtl: number;
  triggered_at:            string;
}

interface AlertUpdate {
  alertId: string;
  last_triggered_at: string;
}

// ─── Core evaluation engine (extracted from edge function) ────

async function runAlertEngine(
  alerts:        typeof FIXTURE_ALERTS[number][],
  latestPrices:  Record<string, number>,
  nowMs:         number,
  deps: {
    insertHistory:   (row: HistoryInsert) => Promise<void>;
    updateAlert:     (alertId: string, ts: string) => Promise<void>;
    sendPush:        (userId: string, title: string, body: string, data: object) => Promise<void>;
    getPushTokens:   (userId: string) => Promise<string[]>;
  }
): Promise<{ checked: number; triggered: number; skipped: Record<string, number> }> {
  const triggered   = 0;
  const skipped     = { cooldown: 0, no_price: 0, condition_not_met: 0 };
  let   triggeredCt = 0;
  const nowIso      = new Date(nowMs).toISOString();

  for (const alert of alerts) {
    const result = evaluateAlert(alert as any, latestPrices, nowMs);

    if (result !== 'triggered') {
      skipped[result]++;
      continue;
    }

    triggeredCt++;
    const currentPrice = latestPrices[`${alert.crop_name}||${alert.state}`];

    await deps.insertHistory({
      alert_id:                alert.id,
      user_id:                 alert.user_id,
      crop_name:               alert.crop_name,
      state:                   alert.state,
      condition:               alert.condition,
      target_price_per_qtl:    alert.target_price_per_qtl,
      triggered_price_per_qtl: currentPrice,
      triggered_at:            nowIso,
    });

    await deps.updateAlert(alert.id, nowIso);

    const tokens = await deps.getPushTokens(alert.user_id);
    if (tokens.length > 0) {
      const verb  = alert.condition === 'above' ? 'crossed above' : 'dropped below';
      const title = `🌾 Price Alert: ${alert.crop_name}`;
      const body  = `${alert.crop_name} ${verb} ₹${alert.target_price_per_qtl}/qtl — now at ₹${currentPrice}/qtl`;
      await deps.sendPush(alert.user_id, title, body, {
        alert_id:  alert.id,
        crop_name: alert.crop_name,
        current:   currentPrice,
        target:    alert.target_price_per_qtl,
      });
    }
  }

  return { checked: alerts.length, triggered: triggeredCt, skipped };
}

// ─── Test suite ───────────────────────────────────────────────

describe('Alert evaluation flow — full integration', () => {
  // Use real Date.now() so cooldown fixtures (relative to now) are evaluated correctly
  const NOW_MS = Date.now();

  let insertHistory:  jest.Mock;
  let updateAlert:    jest.Mock;
  let sendPush:       jest.Mock;
  let getPushTokens:  jest.Mock;

  beforeEach(() => {
    insertHistory  = jest.fn().mockResolvedValue(undefined);
    updateAlert    = jest.fn().mockResolvedValue(undefined);
    sendPush       = jest.fn().mockResolvedValue(undefined);
    getPushTokens  = jest.fn().mockResolvedValue(['ExponentPushToken[abc123]']);
  });

  const deps = () => ({ insertHistory, updateAlert, sendPush, getPushTokens });

  // ─── 1. Triggered alerts fire history + update ──────────────

  it('inserts alert_history for every triggered alert', async () => {
    const { triggered } = await runAlertEngine(
      FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps()
    );
    // alert-001 (Wheat above 2200 ✓), alert-003 (Cotton below 6000 ✓), alert-005 (expired cooldown ✓)
    expect(triggered).toBe(3);
    expect(insertHistory).toHaveBeenCalledTimes(3);
  });

  it('updates last_triggered_at on the alert after firing', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    expect(updateAlert).toHaveBeenCalledWith('alert-001', expect.any(String));
    expect(updateAlert).toHaveBeenCalledWith('alert-003', expect.any(String));
    expect(updateAlert).toHaveBeenCalledWith('alert-005', expect.any(String));
  });

  it('history record contains correct triggered_price and target', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const wheatCall = insertHistory.mock.calls.find(
      ([row]: [HistoryInsert]) => row.alert_id === 'alert-001'
    )?.[0] as HistoryInsert;

    expect(wheatCall).toBeDefined();
    expect(wheatCall.triggered_price_per_qtl).toBe(2400); // Wheat||Gujarat in fixture
    expect(wheatCall.target_price_per_qtl).toBe(2200);
    expect(wheatCall.condition).toBe('above');
    expect(wheatCall.crop_name).toBe('Wheat');
    expect(wheatCall.state).toBe('Gujarat');
  });

  it('triggered_at timestamp is a valid ISO string', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const call = insertHistory.mock.calls[0][0] as HistoryInsert;
    expect(new Date(call.triggered_at).toISOString()).toBe(call.triggered_at);
  });

  // ─── 2. Skipped alerts ───────────────────────────────────────

  it('skips alert-002 — condition not met (Cotton not above 6000)', async () => {
    const { skipped } = await runAlertEngine(
      FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps()
    );
    // alert-002 condition not met, alert-004 in cooldown, alert-006 no price
    expect(skipped.condition_not_met).toBeGreaterThanOrEqual(1);
    expect(skipped.cooldown).toBeGreaterThanOrEqual(1);
    expect(skipped.no_price).toBeGreaterThanOrEqual(1);
  });

  it('does NOT insert history for skipped alerts', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const insertedIds = insertHistory.mock.calls.map(([r]: [HistoryInsert]) => r.alert_id);
    expect(insertedIds).not.toContain('alert-002'); // condition not met
    expect(insertedIds).not.toContain('alert-004'); // in cooldown
    expect(insertedIds).not.toContain('alert-006'); // no price data
  });

  it('does NOT call updateAlert for skipped alerts', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const updatedIds = updateAlert.mock.calls.map(([id]: [string]) => id);
    expect(updatedIds).not.toContain('alert-002');
    expect(updatedIds).not.toContain('alert-004');
    expect(updatedIds).not.toContain('alert-006');
  });

  // ─── 3. Push notifications ───────────────────────────────────

  it('sends a push notification for each triggered alert', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    expect(sendPush).toHaveBeenCalledTimes(3);
  });

  it('push title contains crop name', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const [, title] = sendPush.mock.calls[0] as [string, string, string, object];
    expect(title).toContain('Wheat');
  });

  it('push body contains target price and current price', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const wheatCall = sendPush.mock.calls.find(
      ([uid, title]: [string, string]) => title.includes('Wheat')
    );
    const [, , body] = wheatCall as [string, string, string];
    expect(body).toContain('2200');  // target
    expect(body).toContain('2400');  // current
    expect(body).toContain('crossed above');
  });

  it('uses "dropped below" wording for below-condition alerts', async () => {
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps());
    const cottonCall = sendPush.mock.calls.find(
      ([uid, title]: [string, string]) => title.includes('Cotton')
    );
    const [, , body] = cottonCall as [string, string, string];
    expect(body).toContain('dropped below');
  });

  it('does NOT send push when user has no tokens', async () => {
    const noTokenDeps = { ...deps(), getPushTokens: jest.fn().mockResolvedValue([]) };
    await runAlertEngine(FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, noTokenDeps);
    expect(noTokenDeps.sendPush).not.toHaveBeenCalled();
    // But history + updates should still fire
    expect(noTokenDeps.insertHistory).toHaveBeenCalledTimes(3);
  });

  // ─── 4. Edge cases ───────────────────────────────────────────

  it('returns checked = total alert count', async () => {
    const { checked } = await runAlertEngine(
      FIXTURE_ALERTS as any, FIXTURE_LATEST_PRICES, NOW_MS, deps()
    );
    expect(checked).toBe(FIXTURE_ALERTS.length);
  });

  it('handles empty alert list gracefully', async () => {
    const result = await runAlertEngine([], FIXTURE_LATEST_PRICES, NOW_MS, deps());
    expect(result).toEqual({ checked: 0, triggered: 0, skipped: { cooldown: 0, no_price: 0, condition_not_met: 0 } });
    expect(insertHistory).not.toHaveBeenCalled();
    expect(sendPush).not.toHaveBeenCalled();
  });

  it('handles empty price map (all no_price)', async () => {
    const { triggered, skipped } = await runAlertEngine(
      FIXTURE_ALERTS as any, {}, NOW_MS, deps()
    );
    expect(triggered).toBe(0);
    expect(skipped.no_price).toBe(FIXTURE_ALERTS.length);
  });
});

// ─── kgToQtl conversion in the integration context ────────────

describe('kgToQtl() — used during price loading', () => {
  it('correctly converts fixture market price to qtl', () => {
    // Wheat fixture: 24.00/kg → 2400/qtl
    expect(kgToQtl(24.00)).toBe(2400);
  });

  it('matches FIXTURE_LATEST_PRICES values', () => {
    // Every entry in FIXTURE_LATEST_PRICES was derived via kgToQtl
    expect(kgToQtl(24.00)).toBe(FIXTURE_LATEST_PRICES['Wheat||Gujarat']);
    expect(kgToQtl(58.00)).toBe(FIXTURE_LATEST_PRICES['Cotton||Gujarat']);
    expect(kgToQtl(31.00)).toBe(FIXTURE_LATEST_PRICES['Rice||Punjab']);
  });
});
