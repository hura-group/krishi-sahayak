-- =============================================================
-- KrishiSahayak — Full Database Setup
-- Paste this entire file into:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================

-- ── MIGRATION 1: Core schema ──────────────────────────────────
��-- USERS TABLE
create table users (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  phone text unique not null,
  role text check (role in ('farmer', 'buyer', 'admin')) default 'farmer',
  state text,
  district text,
  village text,
  created_at timestamptz default now()
);

-- FARMS TABLE
create table farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  farm_name text,
  area_acres numeric,
  soil_type text,git init
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz default now()
);

-- CROPS TABLE
create table crops (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references farms(id) on delete cascade,
  crop_name text not null,
  sowing_date date,
  expected_harvest date,
  status text check (status in ('growing','harvested','failed')) default 'growing',
  created_at timestamptz default now()
);

-- MARKET PRICES TABLE
create table market_prices (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  price_per_kg numeric not null,
  market_name text,
  state text,
  recorded_at timestamptz default now()
);

-- GOVT SCHEMES TABLE
create table govt_schemes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  eligibility text,
  benefit_amount numeric,
  last_date date,
  state text,
  source_url text,
  created_at timestamptz default now()
);

-- ENABLE RLS ON ALL TABLES
alter table users enable row level security;
alter table farms enable row level security;
alter table crops enable row level security;
alter table market_prices enable row level security;
alter table govt_schemes enable row level security;

-- POLICIES
create policy "Users can view own profile"
  on users for select using (auth.uid() = id);

create policy "Users can update own profile"
  on users for update using (auth.uid() = id);

create policy "Farmers manage own farms"
  on farms for all using (auth.uid() = user_id);

create policy "Farmers manage own crops"
  on crops for all using (
    auth.uid() = (select user_id from farms where id = crops.farm_id)
  );

create policy "Anyone can view market prices"
  on market_prices for select using (true);

create policy "Anyone can view schemes"
  on govt_schemes for select using (true);

-- ── MIGRATION 2: Price alerts ─────────────────────────────────
-- ============================================================
-- PRICE ALERTS MODULE
-- ============================================================

-- Push tokens (one per user/device)
create table if not exists push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  token       text not null,
  platform    text check (platform in ('ios', 'android', 'web')),
  created_at  timestamptz default now(),
  unique(user_id, token)
);

-- Active price alerts set by the user
create table if not exists price_alerts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users(id) on delete cascade not null,
  crop_name             text not null,
  state                 text not null default 'Gujarat',
  condition             text not null check (condition in ('above', 'below')),
  target_price_per_qtl  numeric not null,        -- ₹ per quintal (100 kg)
  is_active             boolean not null default true,
  last_triggered_at     timestamptz,             -- prevents duplicate alerts within 1 hr
  created_at            timestamptz default now()
);

-- History of every time an alert fired
create table if not exists alert_history (
  id                      uuid primary key default gen_random_uuid(),
  alert_id                uuid references price_alerts(id) on delete cascade not null,
  user_id                 uuid references auth.users(id) on delete cascade not null,
  crop_name               text not null,
  state                   text not null,
  condition               text not null,
  target_price_per_qtl    numeric not null,
  triggered_price_per_qtl numeric not null,
  triggered_at            timestamptz default now()
);

-- Indexes for fast lookups
create index if not exists idx_price_alerts_user    on price_alerts(user_id);
create index if not exists idx_price_alerts_active  on price_alerts(user_id, is_active);
create index if not exists idx_alert_history_user   on alert_history(user_id, triggered_at desc);
create index if not exists idx_push_tokens_user     on push_tokens(user_id);

-- RLS
alter table push_tokens   enable row level security;
alter table price_alerts  enable row level security;
alter table alert_history enable row level security;

-- push_tokens: user manages own
create policy "Users manage own push tokens"
  on push_tokens for all
  using (auth.uid() = user_id);

-- price_alerts: user manages own
create policy "Users manage own alerts"
  on price_alerts for all
  using (auth.uid() = user_id);

-- alert_history: user reads own
create policy "Users read own alert history"
  on alert_history for select
  using (auth.uid() = user_id);

-- Service role can insert history (edge function uses service key)
create policy "Service role inserts alert history"
  on alert_history for insert
  with check (true);

create policy "Service role updates alerts"
  on price_alerts for update
  using (true);

-- ── MIGRATION 3: Mandis ───────────────────────────────────────
-- ============================================================
-- MANDI LOCATOR MODULE
-- ============================================================

create table if not exists mandis (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  address          text not null,
  district         text not null,
  state            text not null,
  lat              numeric(10,7) not null,
  lng              numeric(10,7) not null,
  phone            text,
  -- operating_hours: { mon-sat: "6:00 AM - 2:00 PM", sun: "Closed" }
  operating_hours  jsonb not null default '{}',
  is_active        boolean not null default true,
  created_at       timestamptz default now()
);

create table if not exists mandi_commodities (
  id                  uuid primary key default gen_random_uuid(),
  mandi_id            uuid references mandis(id) on delete cascade not null,
  commodity_name      text not null,
  avg_price_per_qtl   numeric not null,
  min_price_per_qtl   numeric,
  max_price_per_qtl   numeric,
  unit                text not null default 'quintal',
  updated_at          timestamptz default now(),
  unique(mandi_id, commodity_name)
);

create index if not exists idx_mandis_district on mandis(district, state);
create index if not exists idx_mandis_state    on mandis(state);
create index if not exists idx_mandis_location on mandis(lat, lng);
create index if not exists idx_mandi_commodities_mandi on mandi_commodities(mandi_id);

-- RLS: mandis are public read
alter table mandis            enable row level security;
alter table mandi_commodities enable row level security;
create policy "Anyone can read mandis"            on mandis            for select using (true);
create policy "Anyone can read mandi commodities" on mandi_commodities for select using (true);

-- ── SEED DATA ─────────────────────────────────────────────────

insert into mandis (name, address, district, state, lat, lng, phone, operating_hours) values

-- Gujarat
('Ahmedabad APMC',    'APMC Market Yard, Vasna, Ahmedabad',          'Ahmedabad',  'Gujarat',     23.0069,  72.5639, '079-26583000', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"Closed"}'),
('Rajkot APMC',       'APMC Yard, Rajkot-Gondal Road, Rajkot',       'Rajkot',     'Gujarat',     22.2950,  70.7861, '0281-2480300', '{"weekdays":"5:30 AM – 1:00 PM","sunday":"7:00 AM – 11:00 AM"}'),
('Surat APMC',        'APMC Market, Amroli, Surat',                  'Surat',      'Gujarat',     21.2291,  72.8492, '0261-2895500', '{"weekdays":"6:00 AM – 1:00 PM","sunday":"Closed"}'),
('Anand APMC',        'APMC Yard, Anand-Vidyanagar Road, Anand',     'Anand',      'Gujarat',     22.5630,  72.9432, '02692-261555', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"8:00 AM – 12:00 PM"}'),
('Vadodara APMC',     'Makarpura APMC Market, Vadodara',             'Vadodara',   'Gujarat',     22.2676,  73.1757, '0265-2642255', '{"weekdays":"5:00 AM – 1:00 PM","sunday":"Closed"}'),
('Junagadh APMC',     'APMC Yard, Junagadh-Veraval Road',            'Junagadh',   'Gujarat',     21.5245,  70.4671, '0285-2650122', '{"weekdays":"6:00 AM – 1:30 PM","sunday":"Closed"}'),
('Mehsana APMC',      'APMC Yard, Highway Road, Mehsana',            'Mehsana',    'Gujarat',     23.5880,  72.3693, '02762-255400', '{"weekdays":"6:30 AM – 2:00 PM","sunday":"Closed"}'),
('Gondal APMC',       'APMC Market, Gondal, Rajkot District',        'Rajkot',     'Gujarat',     21.9607,  70.8060, '02825-220244', '{"weekdays":"5:00 AM – 1:00 PM","sunday":"7:00 AM – 10:00 AM"}'),

-- Maharashtra
('Pune APMC',         'Market Yard, Gultekdi, Pune',                 'Pune',       'Maharashtra', 18.4950,  73.8497, '020-24261600', '{"weekdays":"5:00 AM – 2:00 PM","sunday":"6:00 AM – 12:00 PM"}'),
('Nashik APMC',       'APMC Market Yard, Panchavati, Nashik',        'Nashik',     'Maharashtra', 20.0001,  73.7837, '0253-2590500', '{"weekdays":"5:30 AM – 1:30 PM","sunday":"Closed"}'),
('Solapur APMC',      'Market Yard, Solapur',                        'Solapur',    'Maharashtra', 17.6805,  75.9063, '0217-2311500', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"Closed"}'),
('Nagpur APMC',       'APMC Market, Wardhaman Nagar, Nagpur',        'Nagpur',     'Maharashtra', 21.1458,  79.0882, '0712-2223640', '{"weekdays":"5:00 AM – 1:00 PM","sunday":"7:00 AM – 11:00 AM"}'),
('Kolhapur APMC',     'APMC Yard, Kolhapur',                         'Kolhapur',   'Maharashtra', 16.7050,  74.2433, '0231-2651200', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"Closed"}'),

-- Punjab
('Amritsar Grain Market', 'Grain Market, GT Road, Amritsar',         'Amritsar',   'Punjab',      31.6340,  74.8723, '0183-2220100', '{"weekdays":"6:00 AM – 3:00 PM","sunday":"7:00 AM – 1:00 PM"}'),
('Ludhiana Grain Market', 'Focal Point, Ludhiana',                   'Ludhiana',   'Punjab',      30.9010,  75.8573, '0161-2443200', '{"weekdays":"5:30 AM – 2:00 PM","sunday":"Closed"}'),
('Jalandhar APMC',    'APMC Market, Jalandhar',                      'Jalandhar',  'Punjab',      31.3260,  75.5762, '0181-2450700', '{"weekdays":"6:00 AM – 2:30 PM","sunday":"Closed"}'),
('Patiala Mandi',     'Grain Market, Patiala',                       'Patiala',    'Punjab',      30.3398,  76.3869, '0175-2305400', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"8:00 AM – 12:00 PM"}'),

-- Uttar Pradesh
('Lucknow Mandi',     'Aishbagh Mandi, Lucknow',                     'Lucknow',    'Uttar Pradesh',26.8467, 80.9462, '0522-2620344', '{"weekdays":"5:00 AM – 2:00 PM","sunday":"6:00 AM – 12:00 PM"}'),
('Agra Mandi',        'Grain Mandi, Sanjay Place, Agra',             'Agra',       'Uttar Pradesh',27.1767, 78.0081, '0562-2260400', '{"weekdays":"5:30 AM – 2:00 PM","sunday":"Closed"}'),
('Kanpur Mandi',      'Azad Mandi, Kanpur',                          'Kanpur',     'Uttar Pradesh',26.4499, 80.3319, '0512-2303550', '{"weekdays":"5:00 AM – 1:30 PM","sunday":"Closed"}'),
('Varanasi Mandi',    'Lahartara Krishi Utpadan Mandi, Varanasi',    'Varanasi',   'Uttar Pradesh',25.3176, 82.9739, '0542-2507700', '{"weekdays":"5:30 AM – 2:00 PM","sunday":"7:00 AM – 11:00 AM"}'),

-- Madhya Pradesh
('Indore Krishi Mandi','Loha Mandi Campus, Indore',                  'Indore',     'Madhya Pradesh',22.7196, 75.8577, '0731-2491700', '{"weekdays":"5:00 AM – 2:00 PM","sunday":"Closed"}'),
('Bhopal Mandi',      'Karond Mandi, Bhopal',                        'Bhopal',     'Madhya Pradesh',23.2599, 77.4126, '0755-2742555', '{"weekdays":"5:30 AM – 2:00 PM","sunday":"6:00 AM – 12:00 PM"}'),
('Ujjain Mandi',      'Freeganj Mandi, Ujjain',                      'Ujjain',     'Madhya Pradesh',23.1765, 75.7885, '0734-2512400', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"Closed"}'),

-- Rajasthan
('Jaipur RAPMC',      'Muhana Mandi, Tonk Road, Jaipur',             'Jaipur',     'Rajasthan',   26.7923,  75.8122, '0141-2771700', '{"weekdays":"5:30 AM – 2:00 PM","sunday":"Closed"}'),
('Jodhpur Mandi',     'Krishi Upaj Mandi, Jodhpur',                  'Jodhpur',    'Rajasthan',   26.2389,  73.0243, '0291-2636600', '{"weekdays":"6:00 AM – 2:00 PM","sunday":"7:00 AM – 11:00 AM"}'),
('Bikaner Mandi',     'Rani Bazar Mandi, Bikaner',                   'Bikaner',    'Rajasthan',   28.0229,  73.3119, '0151-2226300', '{"weekdays":"5:00 AM – 1:30 PM","sunday":"Closed"}'),

-- Haryana
('Karnal Mandi',      'Anaj Mandi, Karnal',                          'Karnal',     'Haryana',     29.6857,  76.9905, '0184-2271200', '{"weekdays":"5:30 AM – 2:00 PM","sunday":"Closed"}'),
('Hisar Mandi',       'Old Grain Market, Hisar',                     'Hisar',      'Haryana',     29.1492,  75.7217, '01662-220400', '{"weekdays":"6:00 AM – 2:30 PM","sunday":"7:00 AM – 12:00 PM"}'),
('Sirsa Mandi',       'Anaj Mandi, Sirsa',                           'Sirsa',      'Haryana',     29.5338,  75.0305, '01666-246500', '{"weekdays":"5:30 AM – 1:30 PM","sunday":"Closed"}');

-- ── COMMODITY PRICES (linked to mandis by name match) ─────────

-- Ahmedabad APMC commodities
insert into mandi_commodities (mandi_id, commodity_name, avg_price_per_qtl, min_price_per_qtl, max_price_per_qtl)
select id, 'Wheat',     2380, 2250, 2500 from mandis where name='Ahmedabad APMC' union all
select id, 'Cotton',    6200, 5900, 6600 from mandis where name='Ahmedabad APMC' union all
select id, 'Groundnut', 5400, 5100, 5800 from mandis where name='Ahmedabad APMC';

-- Rajkot APMC
insert into mandi_commodities (mandi_id, commodity_name, avg_price_per_qtl, min_price_per_qtl, max_price_per_qtl)
select id, 'Groundnut', 5500, 5200, 5900 from mandis where name='Rajkot APMC' union all
select id, 'Cotton',    6300, 6000, 6700 from mandis where name='Rajkot APMC' union all
select id, 'Castor',    5800, 5500, 6200 from mandis where name='Rajkot APMC';

-- Pune APMC
insert into mandi_commodities (mandi_id, commodity_name, avg_price_per_qtl, min_price_per_qtl, max_price_per_qtl)
select id, 'Onion',     1800, 1500, 2200 from mandis where name='Pune APMC' union all
select id, 'Tomato',    2400, 1800, 3200 from mandis where name='Pune APMC' union all
select id, 'Potato',    1400, 1200, 1700 from mandis where name='Pune APMC';

-- Amritsar Grain Market
insert into mandi_commodities (mandi_id, commodity_name, avg_price_per_qtl, min_price_per_qtl, max_price_per_qtl)
select id, 'Wheat',     2350, 2150, 2600 from mandis where name='Amritsar Grain Market' union all
select id, 'Rice',      3100, 2900, 3400 from mandis where name='Amritsar Grain Market' union all
select id, 'Maize',     1900, 1700, 2100 from mandis where name='Amritsar Grain Market';

-- Indore Krishi Mandi
insert into mandi_commodities (mandi_id, commodity_name, avg_price_per_qtl, min_price_per_qtl, max_price_per_qtl)
select id, 'Soybean',   4200, 3900, 4600 from mandis where name='Indore Krishi Mandi' union all
select id, 'Wheat',     2400, 2200, 2650 from mandis where name='Indore Krishi Mandi' union all
select id, 'Gram',      5100, 4800, 5500 from mandis where name='Indore Krishi Mandi';

-- Jaipur RAPMC
insert into mandi_commodities (mandi_id, commodity_name, avg_price_per_qtl, min_price_per_qtl, max_price_per_qtl)
select id, 'Mustard',   5200, 4900, 5600 from mandis where name='Jaipur RAPMC' union all
select id, 'Wheat',     2300, 2100, 2550 from mandis where name='Jaipur RAPMC' union all
select id, 'Gram',      5000, 4700, 5400 from mandis where name='Jaipur RAPMC';
