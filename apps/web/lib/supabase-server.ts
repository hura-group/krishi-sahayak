import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client — used in RSC / route handlers
// No browser session needed here; public anon key is fine for market_prices (public table)
export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ─── Market price types ───────────────────────────────────────

export interface MarketPrice {
  id:              string;
  state:           string;
  crop_name:       string;
  price_per_kg:    number;
  price_date:      string;
  recorded_at:     string;
  msp_price_per_kg: number | null;
}

export interface MarketRow extends MarketPrice {
  price_per_qtl:     number;   // × 100
  msp_per_qtl:       number | null;
  vs_msp_pct:        number | null;   // % above/below MSP
  trend:             'above' | 'below' | 'near' | null;
}

// ─── Fetch functions ──────────────────────────────────────────

export async function fetchMarketPrices(state?: string): Promise<MarketRow[]> {
  let query = supabaseServer
    .from('market_prices')
    .select('*')
    .order('recorded_at', { ascending: false })
    .limit(500);

  if (state) query = query.eq('state', state);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row: MarketPrice): MarketRow => {
    const price_per_qtl = Math.round(row.price_per_kg * 100);
    const msp_per_qtl   = row.msp_price_per_kg ? Math.round(row.msp_price_per_kg * 100) : null;
    const vs_msp_pct    = msp_per_qtl
      ? Math.round(((price_per_qtl - msp_per_qtl) / msp_per_qtl) * 100)
      : null;
    const trend =
      vs_msp_pct === null  ? null
      : vs_msp_pct > 5     ? 'above'
      : vs_msp_pct < -5    ? 'below'
      : 'near';

    return { ...row, price_per_qtl, msp_per_qtl, vs_msp_pct, trend };
  });
}

export async function fetchUniqueCommodities(): Promise<string[]> {
  const { data } = await supabaseServer
    .from('market_prices')
    .select('crop_name')
    .order('crop_name');
  const names = [...new Set((data ?? []).map((r: { crop_name: string }) => r.crop_name))];
  return names;
}

export async function fetchUniqueStates(): Promise<string[]> {
  const { data } = await supabaseServer
    .from('market_prices')
    .select('state')
    .order('state');
  const states = [...new Set((data ?? []).map((r: { state: string }) => r.state))];
  return states;
}
