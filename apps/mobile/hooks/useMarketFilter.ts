import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../src/lib/supabase';
import { useMarketFilterContext } from '../src/context/MarketFilterContext';

export interface MarketPrice {
  id: string;
  state: string;
  crop_name: string;
  price_per_kg: number;
  price_date: string;
  recorded_at: string;
  msp_price_per_kg?: number;
}

interface UseMarketFilterReturn {
  prices: MarketPrice[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useMarketFilter = (): UseMarketFilterReturn => {
  const { filter } = useMarketFilterContext();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filter.dateRange);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      let query = supabase
        .from('market_prices')
        .select('*')
        .eq('state', filter.state)
        .gte('price_date', cutoffStr);

      if (filter.crops.length > 0) {
        query = query.in('crop_name', filter.crops);
      }

      switch (filter.sort) {
        case 'price_asc':
          query = query.order('price_per_kg', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('price_per_kg', { ascending: false });
          break;
        case 'name_asc':
          query = query.order('crop_name', { ascending: true });
          break;
        case 'date_desc':
        default:
          query = query.order('recorded_at', { ascending: false });
          break;
      }

      const { data, error: supabaseError } = await query.limit(100);

      if (supabaseError) throw supabaseError;
      setPrices(data ?? []);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load market prices');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  return { prices, loading, error, refresh: fetchPrices };
};
