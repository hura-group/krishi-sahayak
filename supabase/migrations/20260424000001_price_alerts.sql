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
