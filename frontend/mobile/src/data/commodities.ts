// ─────────────────────────────────────────────────────────────────────────────
// KrishiSahayak — Commodities (static data)
// `name` matches the `crop_name` column exactly (Title Case, as seeded in
// supabase/seed.sql and supabase/migrations/*_mandis.sql).
// Includes the 12 crops already seeded in the DB (Wheat, Cotton, Gram, etc.)
// plus 40+ more covering cereals, pulses, oilseeds, cash crops, vegetables,
// fruits & spices commonly traded across Indian APMC mandis.
// ─────────────────────────────────────────────────────────────────────────────

export type CommodityCategory =
  | 'Cereals'
  | 'Pulses'
  | 'Oilseeds'
  | 'Cash Crops'
  | 'Vegetables'
  | 'Fruits'
  | 'Spices';

export interface CommodityEntry {
  name: string;       // matches crop_name in DB
  category: CommodityCategory;
  icon: string;
}

export const COMMODITIES_DATA: CommodityEntry[] = [
  // ── Cereals ──────────────────────────────────────────────────────────────
  { name: 'Wheat',          category: 'Cereals', icon: '🌾' },
  { name: 'Rice',           category: 'Cereals', icon: '🌾' },
  { name: 'Maize',          category: 'Cereals', icon: '🌽' },
  { name: 'Bajra',          category: 'Cereals', icon: '🌾' },
  { name: 'Jowar',          category: 'Cereals', icon: '🌾' },
  { name: 'Ragi',           category: 'Cereals', icon: '🌾' },
  { name: 'Barley',         category: 'Cereals', icon: '🌾' },

  // ── Pulses ───────────────────────────────────────────────────────────────
  { name: 'Gram',           category: 'Pulses', icon: '🫘' },   // Chana — already seeded
  { name: 'Tur Dal',        category: 'Pulses', icon: '🫘' },
  { name: 'Moong',          category: 'Pulses', icon: '🫘' },
  { name: 'Urad',           category: 'Pulses', icon: '🫘' },
  { name: 'Masoor',         category: 'Pulses', icon: '🫘' },
  { name: 'Lobia',          category: 'Pulses', icon: '🫘' },

  // ── Oilseeds ─────────────────────────────────────────────────────────────
  { name: 'Groundnut',      category: 'Oilseeds', icon: '🥜' },
  { name: 'Soybean',        category: 'Oilseeds', icon: '🌱' },
  { name: 'Mustard',        category: 'Oilseeds', icon: '🌻' },
  { name: 'Sunflower',      category: 'Oilseeds', icon: '🌻' },
  { name: 'Sesame',         category: 'Oilseeds', icon: '🌱' },
  { name: 'Castor',         category: 'Oilseeds', icon: '🌱' },
  { name: 'Linseed',        category: 'Oilseeds', icon: '🌱' },

  // ── Cash Crops ───────────────────────────────────────────────────────────
  { name: 'Cotton',         category: 'Cash Crops', icon: '🪴' },
  { name: 'Sugarcane',      category: 'Cash Crops', icon: '🎋' },
  { name: 'Jute',           category: 'Cash Crops', icon: '🌿' },
  { name: 'Tobacco',        category: 'Cash Crops', icon: '🌿' },

  // ── Vegetables ───────────────────────────────────────────────────────────
  { name: 'Onion',          category: 'Vegetables', icon: '🧅' },
  { name: 'Potato',         category: 'Vegetables', icon: '🥔' },
  { name: 'Tomato',         category: 'Vegetables', icon: '🍅' },
  { name: 'Brinjal',        category: 'Vegetables', icon: '🍆' },
  { name: 'Cabbage',        category: 'Vegetables', icon: '🥬' },
  { name: 'Cauliflower',    category: 'Vegetables', icon: '🥦' },
  { name: 'Garlic',         category: 'Vegetables', icon: '🧄' },
  { name: 'Ginger',         category: 'Vegetables', icon: '🫚' },
  { name: 'Green Peas',     category: 'Vegetables', icon: '🫛' },
  { name: 'Capsicum',       category: 'Vegetables', icon: '🫑' },
  { name: 'Lady Finger',    category: 'Vegetables', icon: '🌿' },
  { name: 'Carrot',         category: 'Vegetables', icon: '🥕' },
  { name: 'Cucumber',       category: 'Vegetables', icon: '🥒' },
  { name: 'Pumpkin',        category: 'Vegetables', icon: '🎃' },
  { name: 'Bottle Gourd',   category: 'Vegetables', icon: '🌿' },

  // ── Fruits ───────────────────────────────────────────────────────────────
  { name: 'Mango',          category: 'Fruits', icon: '🥭' },
  { name: 'Banana',         category: 'Fruits', icon: '🍌' },
  { name: 'Grapes',         category: 'Fruits', icon: '🍇' },
  { name: 'Pomegranate',    category: 'Fruits', icon: '🍎' },
  { name: 'Apple',          category: 'Fruits', icon: '🍎' },
  { name: 'Watermelon',     category: 'Fruits', icon: '🍉' },
  { name: 'Papaya',         category: 'Fruits', icon: '🍈' },
  { name: 'Coconut',        category: 'Fruits', icon: '🥥' },
  { name: 'Guava',          category: 'Fruits', icon: '🍐' },
  { name: 'Orange',         category: 'Fruits', icon: '🍊' },

  // ── Spices ───────────────────────────────────────────────────────────────
  { name: 'Red Chilli',     category: 'Spices', icon: '🌶️' },
  { name: 'Turmeric',       category: 'Spices', icon: '🟡' },
  { name: 'Coriander',      category: 'Spices', icon: '🌿' },
  { name: 'Cumin',          category: 'Spices', icon: '🌿' },
  { name: 'Fenugreek',      category: 'Spices', icon: '🌿' },
  { name: 'Cardamom',       category: 'Spices', icon: '🌿' },
  { name: 'Black Pepper',   category: 'Spices', icon: '⚫' },
  { name: 'Fennel',         category: 'Spices', icon: '🌿' },
  { name: 'Ajwain',         category: 'Spices', icon: '🌿' },
];

export const COMMODITY_CATEGORY_ORDER: CommodityCategory[] = [
  'Cereals', 'Pulses', 'Oilseeds', 'Cash Crops', 'Vegetables', 'Fruits', 'Spices',
];

/** Flat list of all commodity names — used for simple pickers & filters. */
export const ALL_COMMODITIES: string[] = COMMODITIES_DATA.map((c) => c.name);

export const COMMODITIES_BY_CATEGORY: Record<string, CommodityEntry[]> =
  COMMODITY_CATEGORY_ORDER.reduce((acc, cat) => {
    acc[cat] = COMMODITIES_DATA.filter((c) => c.category === cat);
    return acc;
  }, {} as Record<string, CommodityEntry[]>);

export const getCommodityIcon = (name: string): string =>
  COMMODITIES_DATA.find((c) => c.name === name)?.icon ?? '🌾';

export const isValidCommodity = (name: string): boolean => ALL_COMMODITIES.includes(name);
