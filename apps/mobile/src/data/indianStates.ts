// ─────────────────────────────────────────────────────────────────────────────
// KrishiSahayak — Indian States & Union Territories (static data)
// Full names match the `state` column used in market_prices / mandis / price_alerts
// ─────────────────────────────────────────────────────────────────────────────

export interface StateEntry {
  name: string;
  region: 'North' | 'South' | 'East' | 'West' | 'Central' | 'North-East' | 'Union Territory';
}

export const INDIAN_STATES_DATA: StateEntry[] = [
  // ── North ──
  { name: 'Haryana',            region: 'North' },
  { name: 'Himachal Pradesh',   region: 'North' },
  { name: 'Jammu & Kashmir',    region: 'North' },
  { name: 'Ladakh',             region: 'North' },
  { name: 'Punjab',             region: 'North' },
  { name: 'Rajasthan',          region: 'North' },
  { name: 'Uttarakhand',        region: 'North' },
  { name: 'Uttar Pradesh',      region: 'North' },

  // ── West ──
  { name: 'Goa',                region: 'West' },
  { name: 'Gujarat',            region: 'West' },
  { name: 'Maharashtra',        region: 'West' },
  { name: 'Dadra & Nagar Haveli and Daman & Diu', region: 'West' },

  // ── Central ──
  { name: 'Chhattisgarh',       region: 'Central' },
  { name: 'Madhya Pradesh',     region: 'Central' },

  // ── East ──
  { name: 'Bihar',              region: 'East' },
  { name: 'Jharkhand',          region: 'East' },
  { name: 'Odisha',             region: 'East' },
  { name: 'West Bengal',        region: 'East' },

  // ── South ──
  { name: 'Andhra Pradesh',     region: 'South' },
  { name: 'Karnataka',          region: 'South' },
  { name: 'Kerala',             region: 'South' },
  { name: 'Tamil Nadu',         region: 'South' },
  { name: 'Telangana',          region: 'South' },
  { name: 'Puducherry',         region: 'South' },

  // ── North-East ──
  { name: 'Arunachal Pradesh',  region: 'North-East' },
  { name: 'Assam',              region: 'North-East' },
  { name: 'Manipur',            region: 'North-East' },
  { name: 'Meghalaya',          region: 'North-East' },
  { name: 'Mizoram',            region: 'North-East' },
  { name: 'Nagaland',           region: 'North-East' },
  { name: 'Sikkim',             region: 'North-East' },
  { name: 'Tripura',            region: 'North-East' },

  // ── Union Territories ──
  { name: 'Andaman & Nicobar Islands', region: 'Union Territory' },
  { name: 'Chandigarh',                region: 'Union Territory' },
  { name: 'Delhi',                     region: 'Union Territory' },
  { name: 'Lakshadweep',               region: 'Union Territory' },
];

/** Flat list of all 36 state/UT names — used for simple pickers & filters. */
export const INDIAN_STATES: string[] = INDIAN_STATES_DATA.map((s) => s.name);

/** Region display order, north-to-south-ish, UTs last. */
export const STATE_REGION_ORDER: StateEntry['region'][] = [
  'North', 'West', 'Central', 'East', 'South', 'North-East', 'Union Territory',
];

export const STATES_BY_REGION: Record<string, string[]> = STATE_REGION_ORDER.reduce(
  (acc, region) => {
    acc[region] = INDIAN_STATES_DATA.filter((s) => s.region === region).map((s) => s.name);
    return acc;
  },
  {} as Record<string, string[]>,
);

export const isValidState = (name: string): boolean => INDIAN_STATES.includes(name);
