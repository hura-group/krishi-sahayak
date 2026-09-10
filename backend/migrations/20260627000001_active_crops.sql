-- ============================================================
-- ACTIVE CROPS LOOKUP
-- ============================================================
-- Returns every crop currently growing across all of a user's farms.
-- Used by the Market Filter module to default the commodity filter to
-- the farmer's own active crops, instead of relying on price_alerts
-- (which only reflects crops they've set a price watch on, not what
-- they actually grow).
--
-- NOTE: the underlying `crops` table (farm_id, crop_name, status) was
-- already defined in 20260318000001_init_schema.sql but had no RPC or
-- service wired up to read it — this migration is the first consumer.

create or replace function get_active_crops_by_user_id(p_user_id uuid)
returns table (
  crop_id          uuid,
  crop_name        text,
  farm_id          uuid,
  farm_name        text,
  sowing_date      date,
  expected_harvest date
)
language sql
stable
as $$
  select
    c.id   as crop_id,
    c.crop_name,
    c.farm_id,
    f.farm_name,
    c.sowing_date,
    c.expected_harvest
  from crops c
  join farms f on f.id = c.farm_id
  where f.user_id = p_user_id
    and c.status = 'growing'
  order by c.created_at desc;
$$;

comment on function get_active_crops_by_user_id(uuid) is
  'Distinct currently-growing crops across all farms owned by p_user_id. Powers Market Filter profile defaults.';
