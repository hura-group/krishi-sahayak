/**
 * alertEvaluator.ts
 *
 * Pure business logic for evaluating price alerts.
 * Extracted from the edge function so it can be unit-tested without Deno/Supabase.
 * The edge function imports and calls these functions after loading DB data.
 */

export type AlertCondition = 'above' | 'below';

export interface AlertRecord {
  id:                   string;
  user_id:              string;
  crop_name:            string;
  state:                string;
  condition:            AlertCondition;
  target_price_per_qtl: number;
  last_triggered_at:    string | null;
}

export const COOLDOWN_MINUTES = 60;

/**
 * Returns true when the alert's cooldown has NOT expired yet
 * (i.e., we should skip this alert to avoid spam).
 */
export function isInCooldown(lastTriggeredAt: string | null, nowMs: number): boolean {
  if (!lastTriggeredAt) return false;
  const lastMs  = new Date(lastTriggeredAt).getTime();
  const diffMin = (nowMs - lastMs) / 1000 / 60;
  return diffMin < COOLDOWN_MINUTES;
}

/**
 * Evaluates whether a price alert condition is met.
 * Uses strict inequality — target price itself does NOT fire the alert.
 */
export function isConditionMet(
  condition:            AlertCondition,
  currentPrice:         number,
  targetPrice:          number,
): boolean {
  if (condition === 'above') return currentPrice > targetPrice;
  if (condition === 'below') return currentPrice < targetPrice;
  return false;
}

/**
 * Full evaluation of one alert against current market data.
 * Returns 'triggered' | 'cooldown' | 'no_price' | 'condition_not_met'.
 */
export type EvalResult = 'triggered' | 'cooldown' | 'no_price' | 'condition_not_met';

export function evaluateAlert(
  alert:          AlertRecord,
  latestPrices:   Record<string, number>,   // key = "crop_name||state"
  nowMs:          number,
): EvalResult {
  const key          = `${alert.crop_name}||${alert.state}`;
  const currentPrice = latestPrices[key];

  if (currentPrice == null)                                  return 'no_price';
  if (isInCooldown(alert.last_triggered_at, nowMs))          return 'cooldown';
  if (!isConditionMet(alert.condition, currentPrice, alert.target_price_per_qtl))
                                                             return 'condition_not_met';
  return 'triggered';
}

/**
 * Converts price_per_kg → price_per_qtl (100 kg) rounded to 2 dp.
 */
export function kgToQtl(pricePerKg: number): number {
  return parseFloat((pricePerKg * 100).toFixed(2));
}

/**
 * Calculates the % delta between current and MSP prices.
 * Returns null when msp is not available.
 */
export function calcVsMspPct(pricePerQtl: number, mspPerQtl: number | null): number | null {
  if (!mspPerQtl) return null;
  return Math.round(((pricePerQtl - mspPerQtl) / mspPerQtl) * 100);
}

/**
 * Classifies a price vs MSP percentage into a trend label.
 * > +5% = above, < -5% = below, within ±5% = near, no MSP = null.
 */
export function classifyTrend(
  vsMspPct: number | null,
): 'above' | 'below' | 'near' | null {
  if (vsMspPct === null) return null;
  if (vsMspPct > 5)  return 'above';
  if (vsMspPct < -5) return 'below';
  return 'near';
}
