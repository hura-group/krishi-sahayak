/**
 * unit/services/marketFilter.test.ts
 * Tests fetchMarketPrices() transformation logic and state filtering.
 */

import { FIXTURE_MARKET_PRICES } from '../../fixtures';

const mockFrom = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({ from: mockFrom, auth: { getUser: jest.fn() } })),
}));

import {
  fetchMarketPrices,
  fetchUniqueCommodities,
  fetchUniqueStates,
} from '../../../apps/web/lib/supabase-server';

// ── Chain builder ─────────────────────────────────────────────

function makeChain(rows: any[], error?: { message: string }) {
  const result = { data: error ? null : rows, error: error ?? null };
  const chain: any = {};
  ['select','eq','neq','gte','lte','gt','lt','ilike','order','limit','range'].forEach(m => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: Function) => Promise.resolve(result).then(resolve as any);
  return chain;
}

function setup(rows: any[], error?: { message: string }) {
  mockFrom.mockReturnValue(makeChain(rows, error));
}

beforeEach(() => jest.clearAllMocks());

// ── price_per_qtl ─────────────────────────────────────────────

describe('fetchMarketPrices() — price_per_qtl', () => {
  it('converts price_per_kg × 100 and rounds', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[0] }]);
    expect((await fetchMarketPrices())[0].price_per_qtl).toBe(2400);
  });
  it('rounds non-integer kg correctly (22.754 → 2275)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[0], price_per_kg: 22.754 }]);
    expect((await fetchMarketPrices())[0].price_per_qtl).toBe(2275);
  });
  it('handles zero price', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[0], price_per_kg: 0 }]);
    expect((await fetchMarketPrices())[0].price_per_qtl).toBe(0);
  });
});

// ── msp_per_qtl ───────────────────────────────────────────────

describe('fetchMarketPrices() — msp_per_qtl', () => {
  it('converts msp_price_per_kg × 100 when present', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[0] }]);
    expect((await fetchMarketPrices())[0].msp_per_qtl).toBe(2275);
  });
  it('returns null when msp_price_per_kg is null', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[3] }]); // Onion — no MSP
    expect((await fetchMarketPrices())[0].msp_per_qtl).toBeNull();
  });
});

// ── vs_msp_pct ────────────────────────────────────────────────

describe('fetchMarketPrices() — vs_msp_pct', () => {
  it('calculates +5% for Wheat (2400 vs MSP 2275)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[0] }]);
    expect((await fetchMarketPrices())[0].vs_msp_pct).toBe(5);
  });
  it('calculates -6% for Cotton below MSP (5800 vs 6200)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[1] }]);
    expect((await fetchMarketPrices())[0].vs_msp_pct).toBe(-6);
  });
  it('returns null when no MSP', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[3] }]);
    expect((await fetchMarketPrices())[0].vs_msp_pct).toBeNull();
  });
  it('returns 0 when price = MSP exactly', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[5] }]);
    expect((await fetchMarketPrices())[0].vs_msp_pct).toBe(0);
  });
});

// ── trend classification ──────────────────────────────────────

describe('fetchMarketPrices() — trend', () => {
  it('"above" when > +5% (Groundnut: +5.99%)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[4] }]);
    expect((await fetchMarketPrices())[0].trend).toBe('above');
  });
  it('"below" when < -5% (Cotton: -6.45%)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[1] }]);
    expect((await fetchMarketPrices())[0].trend).toBe('below');
  });
  it('"near" for Rice Punjab (+3.3%)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[2] }]);
    expect((await fetchMarketPrices())[0].trend).toBe('near');
  });
  it('"near" at 0% (price = MSP)', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[5] }]);
    expect((await fetchMarketPrices())[0].trend).toBe('near');
  });
  it('"near" at exactly +5% boundary (NOT "above")', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[6] }]); // Mustard: exactly +5%
    expect((await fetchMarketPrices())[0].trend).toBe('near');
  });
  it('null trend when no MSP', async () => {
    setup([{ ...FIXTURE_MARKET_PRICES[3] }]);
    expect((await fetchMarketPrices())[0].trend).toBeNull();
  });
});

// ── state filter ──────────────────────────────────────────────

describe('fetchMarketPrices() — state filter', () => {
  it('returns rows for Gujarat only', async () => {
    const gujarat = FIXTURE_MARKET_PRICES.filter(r => r.state === 'Gujarat');
    setup([...gujarat]);
    const rows = await fetchMarketPrices('Gujarat');
    expect(rows).toHaveLength(gujarat.length);
    expect(rows.every(r => r.state === 'Gujarat')).toBe(true);
  });
  it('returns empty array for unknown state', async () => {
    setup([]);
    expect(await fetchMarketPrices('Arunachal Pradesh')).toEqual([]);
  });
  it('returns all rows with no filter', async () => {
    setup([...FIXTURE_MARKET_PRICES]);
    expect((await fetchMarketPrices())).toHaveLength(FIXTURE_MARKET_PRICES.length);
  });
});

// ── error handling ────────────────────────────────────────────

describe('fetchMarketPrices() — errors', () => {
  it('throws when Supabase returns an error', async () => {
    setup([], { message: 'relation "market_prices" does not exist' });
    await expect(fetchMarketPrices()).rejects.toThrow('market_prices');
  });
  it('returns empty array when data is null/empty', async () => {
    setup([]);
    expect(await fetchMarketPrices()).toEqual([]);
  });
});

// ── fetchUniqueCommodities / fetchUniqueStates ────────────────

describe('fetchUniqueCommodities()', () => {
  it('deduplicates crop names', async () => {
    setup([{ crop_name: 'Wheat' }, { crop_name: 'Wheat' }, { crop_name: 'Cotton' }]);
    const names = await fetchUniqueCommodities();
    expect(names.filter(n => n === 'Wheat')).toHaveLength(1);
    expect(names).toContain('Cotton');
  });
  it('returns [] with no data', async () => {
    setup([]);
    expect(await fetchUniqueCommodities()).toEqual([]);
  });
});

describe('fetchUniqueStates()', () => {
  it('deduplicates state names', async () => {
    setup([{ state: 'Gujarat' }, { state: 'Gujarat' }, { state: 'Punjab' }]);
    const states = await fetchUniqueStates();
    expect(states.filter(s => s === 'Gujarat')).toHaveLength(1);
    expect(states).toContain('Punjab');
  });
  it('returns [] with no data', async () => {
    setup([]);
    expect(await fetchUniqueStates()).toEqual([]);
  });
});
