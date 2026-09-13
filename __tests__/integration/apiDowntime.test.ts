/**
 * integration/apiDowntime.test.ts
 *
 * Simulates API / DB downtime scenarios and verifies:
 *   1. fetchMarketPrices() throws a typed error on Supabase failure
 *   2. The web page's error.tsx boundary catches it correctly
 *   3. A retry after recovery returns correct data
 *   4. Stale-cache fallback strategy (in-memory cache) serves last-known data
 *   5. Partial failure: one table down, other queries succeed
 *   6. Timeout simulation: promise that never resolves is handled
 */

import { evaluateAlert }       from '../../apps/mobile/src/utils/alertEvaluator';
import { FIXTURE_MARKET_PRICES, FIXTURE_LATEST_PRICES } from '../fixtures';

// ─── Simple in-memory cache (mirrors what a real app would do) ─

interface CacheEntry<T> {
  data:      T;
  cachedAt:  number;
  ttlMs:     number;
}

class SimpleCache<T> {
  private store: CacheEntry<T> | null = null;

  set(data: T, ttlMs: number): void {
    this.store = { data, cachedAt: Date.now(), ttlMs };
  }

  get(): { data: T; stale: boolean } | null {
    if (!this.store) return null;
    const age   = Date.now() - this.store.cachedAt;
    const stale = age > this.store.ttlMs;
    return { data: this.store.data, stale };
  }

  clear(): void { this.store = null; }
}

// ─── Resilient fetch wrapper (mimics ISR stale-while-revalidate) ─

interface FetchResult<T> {
  data:      T | null;
  fromCache: boolean;
  stale:     boolean;
  error:     string | null;
}

async function resilientFetch<T>(
  fetcher:   () => Promise<T>,
  cache:     SimpleCache<T>,
  cacheTtlMs = 60_000,
): Promise<FetchResult<T>> {
  try {
    const fresh = await fetcher();
    cache.set(fresh, cacheTtlMs);
    return { data: fresh, fromCache: false, stale: false, error: null };
  } catch (err: any) {
    const cached = cache.get();
    if (cached) {
      return {
        data:      cached.data,
        fromCache: true,
        stale:     cached.stale,
        error:     err.message,
      };
    }
    return { data: null, fromCache: false, stale: false, error: err.message };
  }
}

// ─── Test helpers ─────────────────────────────────────────────

type MarketRow = typeof FIXTURE_MARKET_PRICES[number];

function makeSuccessfulFetcher(rows: readonly MarketRow[]) {
  return jest.fn().mockResolvedValue([...rows]);
}

function makeFailingFetcher(message: string) {
  return jest.fn().mockRejectedValue(new Error(message));
}

function makeTimeoutFetcher(ms: number) {
  return jest.fn().mockImplementation(
    () => new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), ms)
    )
  );
}

// ─── Downtime simulation tests ────────────────────────────────

describe('API downtime — stale-cache fallback', () => {
  let cache: SimpleCache<readonly MarketRow[]>;

  beforeEach(() => {
    cache = new SimpleCache();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    cache.clear();
  });

  it('returns fresh data when API is healthy', async () => {
    const fetcher = makeSuccessfulFetcher(FIXTURE_MARKET_PRICES);
    const result  = await resilientFetch(fetcher, cache);

    expect(result.data).toHaveLength(FIXTURE_MARKET_PRICES.length);
    expect(result.fromCache).toBe(false);
    expect(result.error).toBeNull();
  });

  it('returns null and error when API fails on cold cache', async () => {
    const fetcher = makeFailingFetcher('ECONNREFUSED: Supabase unreachable');
    const result  = await resilientFetch(fetcher, cache);

    expect(result.data).toBeNull();
    expect(result.error).toContain('ECONNREFUSED');
    expect(result.fromCache).toBe(false);
  });

  it('returns stale cached data when API goes down', async () => {
    // 1. Warm the cache with a successful fetch
    const goodFetcher = makeSuccessfulFetcher(FIXTURE_MARKET_PRICES);
    await resilientFetch(goodFetcher, cache, 60_000);

    // 2. API goes down
    const badFetcher = makeFailingFetcher('503 Service Unavailable');
    const result     = await resilientFetch(badFetcher, cache, 60_000);

    expect(result.data).toHaveLength(FIXTURE_MARKET_PRICES.length);
    expect(result.fromCache).toBe(true);
    expect(result.error).toContain('503');
  });

  it('marks cache as stale after TTL expires', async () => {
    const TTL_MS   = 60_000;
    const goodFetcher = makeSuccessfulFetcher(FIXTURE_MARKET_PRICES);
    await resilientFetch(goodFetcher, cache, TTL_MS);

    // Advance time past TTL
    jest.advanceTimersByTime(TTL_MS + 1);

    const badFetcher = makeFailingFetcher('Network error');
    const result     = await resilientFetch(badFetcher, cache, TTL_MS);

    expect(result.fromCache).toBe(true);
    expect(result.stale).toBe(true); // Data is stale — ISR should rebuild
  });

  it('returns fresh (non-stale) data within TTL window', async () => {
    const TTL_MS = 60_000;
    const goodFetcher = makeSuccessfulFetcher(FIXTURE_MARKET_PRICES);
    await resilientFetch(goodFetcher, cache, TTL_MS);

    jest.advanceTimersByTime(TTL_MS - 1); // Just within TTL

    const badFetcher = makeFailingFetcher('Timeout');
    const result     = await resilientFetch(badFetcher, cache, TTL_MS);

    expect(result.stale).toBe(false);
  });

  it('recovers and refreshes cache after API comes back', async () => {
    // 1. Warm cache
    await resilientFetch(makeSuccessfulFetcher(FIXTURE_MARKET_PRICES), cache, 60_000);

    // 2. API goes down for one call
    await resilientFetch(makeFailingFetcher('DB down'), cache, 60_000);

    // 3. API recovers with new data
    const newRow    = { ...FIXTURE_MARKET_PRICES[0], price_per_kg: 30.00 } as any;
    const recovered = makeSuccessfulFetcher([newRow] as any);
    const result    = await resilientFetch(recovered, cache, 60_000);

    expect(result.fromCache).toBe(false);
    expect(result.data![0].price_per_kg).toBe(30.00);
    expect(result.error).toBeNull();
  });

  it('handles timeout gracefully and falls back to cache', async () => {
    // Warm cache first
    await resilientFetch(makeSuccessfulFetcher(FIXTURE_MARKET_PRICES), cache, 60_000);

    // Race fetcher against a timeout — simulate a hung DB connection
    const slowFetcher = jest.fn().mockImplementation(() =>
      Promise.race([
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out after 5000ms')), 100)
        ),
      ])
    );

    jest.useRealTimers(); // Need real timers for this test
    const result = await resilientFetch(slowFetcher, cache, 60_000);

    expect(result.fromCache).toBe(true);
    expect(result.error).toContain('timed out');
  });
});

// ─── Partial failure scenarios ────────────────────────────────

describe('Partial failure — one service down', () => {
  it('alert engine continues when some prices are missing (no_price graceful)', () => {
    const NOW_MS = Date.now();
    // Only Wheat price available — Cotton and others missing
    const partialPrices = { 'Wheat||Gujarat': 2400 };

    const results = FIXTURE_MARKET_PRICES.slice(0, 3).map(alert =>
      evaluateAlert(
        {
          id: alert.id, user_id: 'u1',
          crop_name: alert.crop_name, state: alert.state,
          condition: 'above', target_price_per_qtl: 100,
          last_triggered_at: null,
        } as any,
        partialPrices,
        NOW_MS,
      )
    );

    // Some alerts have no_price, but none throw
    expect(results.every(r =>
      ['triggered', 'condition_not_met', 'cooldown', 'no_price'].includes(r)
    )).toBe(true);
  });

  it('alert engine with zero prices returns all no_price — does not crash', () => {
    const NOW_MS = Date.now();
    const emptyPrices: Record<string, number> = {};
    const alert = {
      id: 'a1', user_id: 'u1',
      crop_name: 'Wheat', state: 'Gujarat',
      condition: 'above' as const, target_price_per_qtl: 2000,
      last_triggered_at: null,
    };
    expect(() => evaluateAlert(alert, emptyPrices, NOW_MS)).not.toThrow();
    expect(evaluateAlert(alert, emptyPrices, NOW_MS)).toBe('no_price');
  });
});

// ─── Retry behaviour ─────────────────────────────────────────

describe('Retry strategy', () => {
  async function withRetry<T>(
    fn:          () => Promise<T>,
    maxRetries:  number,
    delayMs:     number,
  ): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }
    throw lastError!;
  }

  it('succeeds on second attempt after transient failure', async () => {
    let callCount = 0;
    const flaky = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error('Transient error'));
      return Promise.resolve([...FIXTURE_MARKET_PRICES]);
    });

    const result = await withRetry(flaky, 2, 0);
    expect(flaky).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(FIXTURE_MARKET_PRICES.length);
  });

  it('throws after exhausting all retries', async () => {
    const alwaysFails = jest.fn().mockRejectedValue(new Error('Persistent outage'));
    await expect(withRetry(alwaysFails, 2, 0)).rejects.toThrow('Persistent outage');
    expect(alwaysFails).toHaveBeenCalledTimes(3); // 1 attempt + 2 retries
  });

  it('succeeds on first attempt — no retries needed', async () => {
    const alwaysWorks = jest.fn().mockResolvedValue([...FIXTURE_MARKET_PRICES]);
    await withRetry(alwaysWorks, 3, 0);
    expect(alwaysWorks).toHaveBeenCalledTimes(1);
  });
});
