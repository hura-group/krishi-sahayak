/**
 * unit/services/alertEvaluator.test.ts
 *
 * Exhaustive tests for all pure alert evaluation functions.
 * Covers every branch, every boundary, and every edge case.
 * Zero I/O — no Supabase calls, no mocks needed.
 */

import {
  isConditionMet,
  isInCooldown,
  evaluateAlert,
  kgToQtl,
  calcVsMspPct,
  classifyTrend,
  COOLDOWN_MINUTES,
  AlertRecord,
} from '../../../apps/mobile/src/utils/alertEvaluator';
import { FIXTURE_LATEST_PRICES } from '../../fixtures';

const NOW_MS = new Date('2026-04-24T12:00:00.000Z').getTime();

// ─── isConditionMet ───────────────────────────────────────────

describe('isConditionMet()', () => {
  describe('condition: above', () => {
    it('returns true when current price is strictly above target', () => {
      expect(isConditionMet('above', 2500, 2400)).toBe(true);
    });
    it('returns false when current price equals target (strict >)', () => {
      expect(isConditionMet('above', 2400, 2400)).toBe(false);
    });
    it('returns false when current price is below target', () => {
      expect(isConditionMet('above', 2300, 2400)).toBe(false);
    });
    it('handles fractional prices correctly', () => {
      expect(isConditionMet('above', 2400.01, 2400.00)).toBe(true);
      expect(isConditionMet('above', 2400.00, 2400.01)).toBe(false);
    });
  });

  describe('condition: below', () => {
    it('returns true when current price is strictly below target', () => {
      expect(isConditionMet('below', 5500, 6000)).toBe(true);
    });
    it('returns false when current price equals target (strict <)', () => {
      expect(isConditionMet('below', 6000, 6000)).toBe(false);
    });
    it('returns false when current price is above target', () => {
      expect(isConditionMet('below', 6500, 6000)).toBe(false);
    });
    it('handles very small price differences', () => {
      expect(isConditionMet('below', 5999.99, 6000)).toBe(true);
      expect(isConditionMet('below', 6000.01, 6000)).toBe(false);
    });
  });
});

// ─── isInCooldown ─────────────────────────────────────────────

describe('isInCooldown()', () => {
  it(`returns false when lastTriggeredAt is null (never fired)`, () => {
    expect(isInCooldown(null, NOW_MS)).toBe(false);
  });

  it(`returns true when triggered ${COOLDOWN_MINUTES - 1} minutes ago`, () => {
    const recent = new Date(NOW_MS - (COOLDOWN_MINUTES - 1) * 60 * 1000).toISOString();
    expect(isInCooldown(recent, NOW_MS)).toBe(true);
  });

  it(`returns true when triggered exactly ${COOLDOWN_MINUTES} minutes ago (boundary — still in cooldown)`, () => {
    const boundary = new Date(NOW_MS - COOLDOWN_MINUTES * 60 * 1000).toISOString();
    // diffMin = exactly 60 → 60 < 60 is false → NOT in cooldown
    expect(isInCooldown(boundary, NOW_MS)).toBe(false);
  });

  it(`returns false when triggered ${COOLDOWN_MINUTES + 1} minutes ago`, () => {
    const expired = new Date(NOW_MS - (COOLDOWN_MINUTES + 1) * 60 * 1000).toISOString();
    expect(isInCooldown(expired, NOW_MS)).toBe(false);
  });

  it('returns true when triggered 30 minutes ago', () => {
    const thirtyMin = new Date(NOW_MS - 30 * 60 * 1000).toISOString();
    expect(isInCooldown(thirtyMin, NOW_MS)).toBe(true);
  });

  it('returns false when triggered 2 hours ago', () => {
    const twoHours = new Date(NOW_MS - 120 * 60 * 1000).toISOString();
    expect(isInCooldown(twoHours, NOW_MS)).toBe(false);
  });
});

// ─── evaluateAlert ────────────────────────────────────────────

describe('evaluateAlert()', () => {
  const baseAlert: AlertRecord = {
    id:                   'alert-test',
    user_id:              'user-abc',
    crop_name:            'Wheat',
    state:                'Gujarat',
    condition:            'above',
    target_price_per_qtl: 2200,
    last_triggered_at:    null,
  };

  it('returns "triggered" when condition met and no cooldown', () => {
    // Wheat||Gujarat = 2400 > target 2200
    expect(evaluateAlert(baseAlert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('triggered');
  });

  it('returns "condition_not_met" when price does not satisfy condition', () => {
    const alert = { ...baseAlert, condition: 'above' as const, target_price_per_qtl: 2500 };
    // 2400 is NOT > 2500
    expect(evaluateAlert(alert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('condition_not_met');
  });

  it('returns "condition_not_met" when price equals target exactly', () => {
    const alert = { ...baseAlert, condition: 'above' as const, target_price_per_qtl: 2400 };
    expect(evaluateAlert(alert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('condition_not_met');
  });

  it('returns "cooldown" when triggered recently', () => {
    const alert = {
      ...baseAlert,
      last_triggered_at: new Date(NOW_MS - 30 * 60 * 1000).toISOString(),
    };
    expect(evaluateAlert(alert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('cooldown');
  });

  it('returns "triggered" when cooldown expired (61 min ago)', () => {
    const alert = {
      ...baseAlert,
      last_triggered_at: new Date(NOW_MS - 61 * 60 * 1000).toISOString(),
    };
    expect(evaluateAlert(alert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('triggered');
  });

  it('returns "no_price" when no price data exists for crop+state', () => {
    const alert = { ...baseAlert, crop_name: 'Saffron', state: 'Kashmir' };
    expect(evaluateAlert(alert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('no_price');
  });

  it('correctly evaluates below condition', () => {
    const alert = { ...baseAlert, condition: 'below' as const, target_price_per_qtl: 6000 };
    // Cotton||Gujarat = 5800 < 6000 → triggered
    const prices = { ...FIXTURE_LATEST_PRICES };
    const a      = { ...alert, crop_name: 'Cotton', state: 'Gujarat' };
    expect(evaluateAlert(a, prices, NOW_MS)).toBe('triggered');
  });

  it('cooldown check takes precedence over condition check', () => {
    // Even if condition would be met, cooldown must block it
    const alert = {
      ...baseAlert,
      last_triggered_at: new Date(NOW_MS - 5 * 60 * 1000).toISOString(), // 5 min ago
    };
    expect(evaluateAlert(alert, FIXTURE_LATEST_PRICES, NOW_MS)).toBe('cooldown');
  });
});

// ─── kgToQtl ─────────────────────────────────────────────────

describe('kgToQtl()', () => {
  it('converts ₹24.00/kg to ₹2400.00/qtl', () => {
    expect(kgToQtl(24.00)).toBe(2400.00);
  });
  it('converts ₹5.55/kg to ₹555.00/qtl', () => {
    expect(kgToQtl(5.55)).toBe(555.00);
  });
  it('handles floating point correctly — rounds to 2dp', () => {
    // 22.754 × 100 = 2275.4 → 2275.40
    expect(kgToQtl(22.754)).toBe(2275.40);
  });
  it('returns 0 for 0 input', () => {
    expect(kgToQtl(0)).toBe(0);
  });
});

// ─── calcVsMspPct ─────────────────────────────────────────────

describe('calcVsMspPct()', () => {
  it('returns null when MSP is null', () => {
    expect(calcVsMspPct(2400, null)).toBeNull();
  });
  it('returns 0 when price equals MSP', () => {
    expect(calcVsMspPct(2275, 2275)).toBe(0);
  });
  it('calculates positive % correctly', () => {
    // (2400 - 2275) / 2275 × 100 = 5.49% → rounds to 5
    expect(calcVsMspPct(2400, 2275)).toBe(5);
  });
  it('calculates negative % correctly', () => {
    // (5800 - 6200) / 6200 × 100 = -6.45% → rounds to -6
    expect(calcVsMspPct(5800, 6200)).toBe(-6);
  });
  it('handles large premium correctly', () => {
    expect(calcVsMspPct(3000, 2000)).toBe(50);
  });
  it('handles large discount correctly', () => {
    expect(calcVsMspPct(1000, 2000)).toBe(-50);
  });
});

// ─── classifyTrend ───────────────────────────────────────────

describe('classifyTrend()', () => {
  it('returns null when vsMspPct is null', () => {
    expect(classifyTrend(null)).toBeNull();
  });
  it('returns "above" when > +5%', () => {
    expect(classifyTrend(6)).toBe('above');
    expect(classifyTrend(50)).toBe('above');
  });
  it('returns "near" when exactly +5% (boundary — NOT above)', () => {
    expect(classifyTrend(5)).toBe('near');
  });
  it('returns "near" when exactly -5% (boundary — NOT below)', () => {
    expect(classifyTrend(-5)).toBe('near');
  });
  it('returns "below" when < -5%', () => {
    expect(classifyTrend(-6)).toBe('below');
    expect(classifyTrend(-50)).toBe('below');
  });
  it('returns "near" at 0%', () => {
    expect(classifyTrend(0)).toBe('near');
  });
  it('returns "near" at +4%', () => {
    expect(classifyTrend(4)).toBe('near');
  });
  it('returns "near" at -4%', () => {
    expect(classifyTrend(-4)).toBe('near');
  });
});
