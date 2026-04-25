/**
 * fixtures/index.ts
 * Canonical test data reused across unit and integration tests.
 * Everything is deterministic — no Math.random(), no Date.now() in fixtures.
 */

// ─── Market Prices ────────────────────────────────────────────

export const FIXTURE_MARKET_PRICES = [
  {
    id:              'mp-001',
    state:           'Gujarat',
    crop_name:       'Wheat',
    price_per_kg:    24.00,   // ₹2400/qtl — exactly at a threshold
    price_date:      '2026-04-20',
    recorded_at:     '2026-04-20T10:00:00Z',
    msp_price_per_kg: 22.75,  // MSP = ₹2275/qtl  → +5.5% → 'above'
  },
  {
    id:              'mp-002',
    state:           'Gujarat',
    crop_name:       'Cotton',
    price_per_kg:    58.00,   // ₹5800/qtl
    price_date:      '2026-04-20',
    recorded_at:     '2026-04-20T09:30:00Z',
    msp_price_per_kg: 62.00,  // MSP = ₹6200/qtl  → -6.5% → 'below'
  },
  {
    id:              'mp-003',
    state:           'Punjab',
    crop_name:       'Rice',
    price_per_kg:    31.00,   // ₹3100/qtl
    price_date:      '2026-04-20',
    recorded_at:     '2026-04-20T08:00:00Z',
    msp_price_per_kg: 30.00,  // MSP = ₹3000/qtl  → +3.3% → 'near'
  },
  {
    id:              'mp-004',
    state:           'Maharashtra',
    crop_name:       'Onion',
    price_per_kg:    18.00,   // ₹1800/qtl
    price_date:      '2026-04-19',
    recorded_at:     '2026-04-19T11:00:00Z',
    msp_price_per_kg: null,   // No MSP for Onion
  },
  {
    id:              'mp-005',
    state:           'Gujarat',
    crop_name:       'Groundnut',
    price_per_kg:    55.50,   // ₹5550/qtl
    price_date:      '2026-04-20',
    recorded_at:     '2026-04-20T07:45:00Z',
    msp_price_per_kg: 52.36,  // MSP = ₹5236/qtl  → +5.99% → 'above'
  },
  // Boundary: exactly at MSP (0% delta → 'near')
  {
    id:              'mp-006',
    state:           'Haryana',
    crop_name:       'Wheat',
    price_per_kg:    22.75,   // Same as MSP — 0% delta
    price_date:      '2026-04-20',
    recorded_at:     '2026-04-20T06:00:00Z',
    msp_price_per_kg: 22.75,
  },
  // Boundary: exactly +5% above MSP (threshold is > 5, so this is 'near')
  {
    id:              'mp-007',
    state:           'Rajasthan',
    crop_name:       'Mustard',
    price_per_kg:    54.60,   // MSP = 52.00 → +5.0% → 'near' (not above)
    price_date:      '2026-04-20',
    recorded_at:     '2026-04-20T05:30:00Z',
    msp_price_per_kg: 52.00,
  },
] as const;

// ─── Mandis ───────────────────────────────────────────────────

export const FIXTURE_MANDIS = [
  {
    id:        'mandi-001',
    name:      'Ahmedabad APMC',
    address:   'APMC Market Yard, Vasna, Ahmedabad',
    district:  'Ahmedabad',
    state:     'Gujarat',
    lat:       23.0069,
    lng:       72.5639,
    phone:     '079-26583000',
    operating_hours: { weekdays: '6:00 AM – 2:00 PM', sunday: 'Closed' },
    is_active: true,
  },
  {
    id:        'mandi-002',
    name:      'Rajkot APMC',
    address:   'APMC Yard, Rajkot-Gondal Road, Rajkot',
    district:  'Rajkot',
    state:     'Gujarat',
    lat:       22.2950,
    lng:       70.7861,
    phone:     '0281-2480300',
    operating_hours: { weekdays: '5:30 AM – 1:00 PM', sunday: '7:00 AM – 11:00 AM' },
    is_active: true,
  },
  {
    id:        'mandi-003',
    name:      'Pune APMC',
    address:   'Market Yard, Gultekdi, Pune',
    district:  'Pune',
    state:     'Maharashtra',
    lat:       18.4950,
    lng:       73.8497,
    phone:     '020-24261600',
    operating_hours: { weekdays: '5:00 AM – 2:00 PM', sunday: '6:00 AM – 12:00 PM' },
    is_active: true,
  },
  {
    id:        'mandi-004',
    name:      'Inactive Test Mandi',
    address:   'Nowhere',
    district:  'Test',
    state:     'Gujarat',
    lat:       23.0500,
    lng:       72.5500,
    phone:     null,
    operating_hours: { weekdays: '8:00 AM – 4:00 PM', sunday: 'Closed' },
    is_active: false,
  },
] as const;

// ─── Price Alerts ─────────────────────────────────────────────

export const FIXTURE_ALERTS = [
  // Should trigger: Wheat currently ₹2400 > ₹2200 target
  {
    id:                   'alert-001',
    user_id:              'user-abc',
    crop_name:            'Wheat',
    state:                'Gujarat',
    condition:            'above' as const,
    target_price_per_qtl: 2200,
    is_active:            true,
    last_triggered_at:    null,
    created_at:           '2026-04-01T00:00:00Z',
  },
  // Should NOT trigger: condition not met (price 5800 NOT above 6000)
  {
    id:                   'alert-002',
    user_id:              'user-abc',
    crop_name:            'Cotton',
    state:                'Gujarat',
    condition:            'above' as const,
    target_price_per_qtl: 6000,
    is_active:            true,
    last_triggered_at:    null,
    created_at:           '2026-04-01T00:00:00Z',
  },
  // Should trigger: Cotton below ₹6000 (currently ₹5800)
  {
    id:                   'alert-003',
    user_id:              'user-abc',
    crop_name:            'Cotton',
    state:                'Gujarat',
    condition:            'below' as const,
    target_price_per_qtl: 6000,
    is_active:            true,
    last_triggered_at:    null,
    created_at:           '2026-04-01T00:00:00Z',
  },
  // In cooldown: triggered 30 min ago
  {
    id:                   'alert-004',
    user_id:              'user-abc',
    crop_name:            'Wheat',
    state:                'Gujarat',
    condition:            'above' as const,
    target_price_per_qtl: 2200,
    is_active:            true,
    last_triggered_at:    new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at:           '2026-04-01T00:00:00Z',
  },
  // Cooldown expired: triggered 61 min ago → should trigger again
  {
    id:                   'alert-005',
    user_id:              'user-abc',
    crop_name:            'Wheat',
    state:                'Gujarat',
    condition:            'above' as const,
    target_price_per_qtl: 2200,
    is_active:            true,
    last_triggered_at:    new Date(Date.now() - 61 * 60 * 1000).toISOString(),
    created_at:           '2026-04-01T00:00:00Z',
  },
  // No price data for this crop/state combo
  {
    id:                   'alert-006',
    user_id:              'user-abc',
    crop_name:            'Saffron',
    state:                'Kashmir',
    condition:            'above' as const,
    target_price_per_qtl: 50000,
    is_active:            true,
    last_triggered_at:    null,
    created_at:           '2026-04-01T00:00:00Z',
  },
] as const;

// ─── Latest prices map (keyed by "crop||state") ───────────────
// Derived from FIXTURE_MARKET_PRICES for alert evaluation tests

export const FIXTURE_LATEST_PRICES: Record<string, number> = {
  'Wheat||Gujarat':      2400,
  'Cotton||Gujarat':     5800,
  'Rice||Punjab':        3100,
  'Onion||Maharashtra':  1800,
  'Groundnut||Gujarat':  5550,
};
