import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // eNAM static data (API requires approval)
    // Simulating eNAM auction data format
    const enamPrices = [
      { crop_name: 'Wheat', market_name: 'Ahmedabad APMC', state: 'Gujarat', price_per_kg: 23.50, min_price: 21.00, max_price: 26.00, variety: 'Lokwan', is_auction_live: true, auction_lot_id: 'eNAM-GJ-001' },
      { crop_name: 'Cotton', market_name: 'Rajkot APMC', state: 'Gujarat', price_per_kg: 67.00, min_price: 62.00, max_price: 72.00, variety: 'Shankar-6', is_auction_live: true, auction_lot_id: 'eNAM-GJ-002' },
      { crop_name: 'Groundnut', market_name: 'Junagadh APMC', state: 'Gujarat', price_per_kg: 57.00, min_price: 52.00, max_price: 62.00, variety: 'Bold', is_auction_live: false, auction_lot_id: 'eNAM-GJ-003' },
      { crop_name: 'Soybean', market_name: 'Vadodara APMC', state: 'Gujarat', price_per_kg: 46.00, min_price: 43.00, max_price: 51.00, variety: 'JS-335', is_auction_live: true, auction_lot_id: 'eNAM-GJ-004' },
      { crop_name: 'Maize', market_name: 'Anand APMC', state: 'Gujarat', price_per_kg: 21.00, min_price: 19.00, max_price: 24.00, variety: 'Hybrid', is_auction_live: false, auction_lot_id: 'eNAM-GJ-005' },
    ].map(item => ({
      ...item,
      source: 'enam',
      price_date: new Date().toISOString().split('T')[0],
      recorded_at: new Date().toISOString(),
    }));

    // Upsert eNAM data (deduplicate by commodity+mandi+date+source)
    const { error } = await supabase
      .from('market_prices')
      .upsert(enamPrices, {
        onConflict: 'crop_name,market_name,price_date,source',
        ignoreDuplicates: false,
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        inserted: enamPrices.length,
        live_auctions: enamPrices.filter(p => p.is_auction_live).length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});