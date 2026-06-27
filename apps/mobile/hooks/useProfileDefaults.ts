import { useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { getUserProfile } from '../src/services/profileService';
import { getActiveCropNamesByUserId } from '../src/services/cropService';
import { useMarketFilterContext } from '../src/context/MarketFilterContext';
import { isValidState } from '../src/data/indianStates';
import { isValidCommodity } from '../src/data/commodities';

/**
 * Seeds the Market filter with the user's home state (from their profile)
 * and their actively-growing crops — but only the very first time this
 * runs for the device.
 *
 * Crop source, in priority order:
 *   1. crops table (status = 'growing') across all of the user's farms —
 *      the real source of truth for "what am I currently growing".
 *   2. price_alerts (distinct crop_name) — fallback for farmers who
 *      haven't logged any crops yet but have set up a price watch, so
 *      the filter still has something useful to default to.
 *
 * `applyProfileDefaults` (in MarketFilterContext) is itself idempotent and
 * guarded by an MMKV flag, so calling this on every app/tab mount is safe
 * and never clobbers a filter the user has since changed manually.
 */
export const useProfileDefaults = (): void => {
  const { user } = useAuth();
  const { applyProfileDefaults } = useMarketFilterContext();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user?.id || hasRun.current) return;
    hasRun.current = true;

    (async () => {
      try {
        // 1) Home state from profile
        const profile = await getUserProfile(user.id);
        const profileState =
          profile?.state && isValidState(profile.state) ? profile.state : null;

        // 2) Active crops — prefer the real `crops` table, fall back to
        //    price_alerts if the farmer hasn't logged any crops yet.
        let activeCrops: string[] = [];
        try {
          activeCrops = (await getActiveCropNamesByUserId(user.id)).filter(isValidCommodity);
        } catch {
          // crops lookup failing shouldn't block the fallback below
        }

        if (activeCrops.length === 0) {
          const { data: alertRows, error: alertError } = await supabase
            .from('price_alerts')
            .select('crop_name')
            .eq('user_id', user.id)
            .eq('is_active', true);

          if (alertError) throw alertError;

          activeCrops = Array.from(
            new Set((alertRows ?? []).map((r: { crop_name: string }) => r.crop_name)),
          ).filter(isValidCommodity);
        }

        if (profileState || activeCrops.length > 0) {
          applyProfileDefaults(profileState, activeCrops);
        }
      } catch {
        // Non-fatal — filter simply falls back to its existing/default state.
      }
    })();
  }, [user?.id, applyProfileDefaults]);
};
