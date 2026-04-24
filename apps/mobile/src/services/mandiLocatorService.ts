import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────

export interface OperatingHours {
  weekdays: string;
  sunday:   string;
}

export interface Mandi {
  id:               string;
  name:             string;
  address:          string;
  district:         string;
  state:            string;
  lat:              number;
  lng:              number;
  phone:            string | null;
  operating_hours:  OperatingHours;
  is_active:        boolean;
  // Computed client-side
  distanceKm?:      number;
  isOpenNow?:       boolean;
}

export interface MandiCommodity {
  id:                  string;
  mandi_id:            string;
  commodity_name:      string;
  avg_price_per_qtl:   number;
  min_price_per_qtl:   number | null;
  max_price_per_qtl:   number | null;
  unit:                string;
  updated_at:          string;
}

// ─── Haversine distance (km) ──────────────────────────────────

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Open/closed check ────────────────────────────────────────

/**
 * Checks if a mandi is open right now based on its operating_hours.
 * Parses strings like "6:00 AM – 2:00 PM".
 */
export function isMandiOpenNow(hours: OperatingHours): boolean {
  try {
    const now      = new Date();
    const day      = now.getDay(); // 0 = Sun
    const schedule = day === 0 ? hours.sunday : hours.weekdays;

    if (!schedule || schedule.toLowerCase() === 'closed') return false;

    const parse = (t: string): number => {
      const clean = t.trim().replace('–', '-');
      const [time, meridian] = clean.split(/\s+/);
      let [h, m]             = time.split(':').map(Number);
      if (meridian?.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (meridian?.toUpperCase() === 'AM' && h === 12) h = 0;
      return h * 60 + (m || 0);
    };

    // "6:00 AM – 2:00 PM" → split on –
    const parts = schedule.split(/–|-/).map(s => s.trim());
    if (parts.length < 2) return false;

    const openMin  = parse(parts[0]);
    const closeMin = parse(parts[1]);
    const nowMin   = now.getHours() * 60 + now.getMinutes();

    return nowMin >= openMin && nowMin < closeMin;
  } catch {
    return false;
  }
}

// ─── Service Functions ────────────────────────────────────────

/**
 * Fetch all mandis within ~150km bounding box of a GPS point,
 * then sort by Haversine distance and attach isOpenNow.
 */
export const getNearbyMandis = async (
  userLat: number,
  userLng: number,
  maxRadiusKm = 150
): Promise<Mandi[]> => {
  // Rough bounding box (1° lat ≈ 111 km)
  const delta = maxRadiusKm / 111;

  const { data, error } = await supabase
    .from('mandis')
    .select('*')
    .eq('is_active', true)
    .gte('lat', userLat - delta)
    .lte('lat', userLat + delta)
    .gte('lng', userLng - delta)
    .lte('lng', userLng + delta);

  if (error) throw error;

  return ((data ?? []) as Mandi[])
    .map(m => ({
      ...m,
      distanceKm: Math.round(haversineKm(userLat, userLng, m.lat, m.lng) * 10) / 10,
      isOpenNow:  isMandiOpenNow(m.operating_hours),
    }))
    .filter(m => (m.distanceKm ?? 999) <= maxRadiusKm)
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
};

/** Fetch mandis by district name (fallback when GPS unavailable) */
export const getMandisByDistrict = async (
  district: string,
  state: string
): Promise<Mandi[]> => {
  const { data, error } = await supabase
    .from('mandis')
    .select('*')
    .ilike('district', `%${district}%`)
    .ilike('state', `%${state}%`)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return ((data ?? []) as Mandi[]).map(m => ({
    ...m,
    isOpenNow: isMandiOpenNow(m.operating_hours),
  }));
};

/** Fetch top commodity prices for a specific mandi */
export const getMandiCommodities = async (
  mandiId: string
): Promise<MandiCommodity[]> => {
  const { data, error } = await supabase
    .from('mandi_commodities')
    .select('*')
    .eq('mandi_id', mandiId)
    .order('avg_price_per_qtl', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

/** Build a Google Maps directions URL */
export const buildDirectionsUrl = (
  destLat: number,
  destLng: number,
  mandiName: string,
  userLat?: number,
  userLng?: number
): string => {
  const dest = `${destLat},${destLng}`;
  const label = encodeURIComponent(mandiName);
  if (userLat && userLng) {
    const origin = `${userLat},${userLng}`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${dest}&query_place_id=${label}`;
};
