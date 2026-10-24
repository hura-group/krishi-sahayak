-- =============================================================================
-- supabase/migrations/20260515_000002_gamification.sql
--
-- Adds the Gamification Psychology Hooks schema:
--
--   1. weekly_xp_snapshots — stores each user's XP + rank at the START of
--                            each week so the weekly-summary Edge Function
--                            can calculate weekly gain and rank change.
--
--   2. get_rank_xp_gap()   — RPC called by useAlmostThere hook to find the
--                            XP gap between the current user and the person
--                            ranked immediately above them.
--
--   3. get_weekly_summary()— RPC called by the Edge Function to efficiently
--                            fetch all users' weekly progress in one query.
--
--   4. Scheduled snapshot   — pg_cron job that snapshots all users every
--                            Monday at 00:05 UTC.
--
-- Depends on: user_profiles table with (user_id UUID, total_xp INTEGER).
-- =============================================================================

-- ─── 1. weekly_xp_snapshots ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.weekly_xp_snapshots (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start     DATE         NOT NULL,   -- Monday of the week (YYYY-MM-DD)
  xp_at_start    INTEGER      NOT NULL DEFAULT 0,
  rank_at_start  INTEGER,                 -- leaderboard rank at week start
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT weekly_xp_snapshots_unique UNIQUE (user_id, week_start)
);

COMMENT ON TABLE public.weekly_xp_snapshots IS
  'Stores each user''s XP and rank at the start of each Monday. Used by the weekly-summary Edge Function.';

CREATE INDEX IF NOT EXISTS idx_wxp_user_week
  ON public.weekly_xp_snapshots (user_id, week_start DESC);

ALTER TABLE public.weekly_xp_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can read their own snapshots
CREATE POLICY "wxp_select_own"
  ON public.weekly_xp_snapshots FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can write (Edge Function)
CREATE POLICY "wxp_service_write"
  ON public.weekly_xp_snapshots FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 2. get_rank_xp_gap RPC ───────────────────────────────────────────────────
-- Returns the XP gap between the caller and the person ranked one position above.
-- Used by useAlmostThere to decide whether to show the rank-nudge banner.

CREATE OR REPLACE FUNCTION public.get_rank_xp_gap(p_user_id UUID)
RETURNS TABLE (
  current_rank   INTEGER,
  current_xp     INTEGER,
  next_rank_xp   INTEGER,
  xp_gap         INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked AS (
    SELECT
      user_id,
      total_xp,
      DENSE_RANK() OVER (ORDER BY total_xp DESC)::INTEGER AS rank
    FROM public.user_profiles
  ),
  user_row AS (
    SELECT rank, total_xp FROM ranked WHERE user_id = p_user_id
  ),
  one_above AS (
    SELECT total_xp
    FROM   ranked
    WHERE  rank = (SELECT rank - 1 FROM user_row)
    LIMIT  1
  )
  SELECT
    ur.rank                                         AS current_rank,
    ur.total_xp                                     AS current_xp,
    COALESCE(oa.total_xp, ur.total_xp)              AS next_rank_xp,
    GREATEST(COALESCE(oa.total_xp, 0) - ur.total_xp, 0) AS xp_gap
  FROM user_row ur
  LEFT JOIN one_above oa ON TRUE;
$$;

COMMENT ON FUNCTION public.get_rank_xp_gap IS
  'Returns the current user''s rank and the XP gap to the person ranked directly above them.';

-- ─── 3. get_weekly_summary RPC ────────────────────────────────────────────────
-- Called by the weekly-summary Edge Function.
-- Returns each user with their current XP + rank vs. the snapshot from last Monday.

CREATE OR REPLACE FUNCTION public.get_weekly_summary(p_week_start DATE)
RETURNS TABLE (
  user_id         UUID,
  current_xp      INTEGER,
  current_rank    INTEGER,
  snapshot_xp     INTEGER,
  snapshot_rank   INTEGER,
  xp_earned       INTEGER,
  rank_change     INTEGER   -- positive = improved (moved up)
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_now AS (
    SELECT
      user_id,
      total_xp,
      DENSE_RANK() OVER (ORDER BY total_xp DESC)::INTEGER AS rank
    FROM public.user_profiles
  ),
  snaps AS (
    SELECT user_id, xp_at_start, rank_at_start
    FROM   public.weekly_xp_snapshots
    WHERE  week_start = p_week_start
  )
  SELECT
    r.user_id,
    r.total_xp                                     AS current_xp,
    r.rank                                         AS current_rank,
    COALESCE(s.xp_at_start,   0)                   AS snapshot_xp,
    s.rank_at_start                                AS snapshot_rank,
    r.total_xp - COALESCE(s.xp_at_start, 0)       AS xp_earned,
    COALESCE(s.rank_at_start, r.rank) - r.rank     AS rank_change  -- +N = improved
  FROM ranked_now r
  LEFT JOIN snaps s USING (user_id)
  WHERE r.total_xp > 0;  -- skip inactive users
$$;

COMMENT ON FUNCTION public.get_weekly_summary IS
  'Aggregates weekly XP earned and rank change for all users. Called by the weekly-summary Edge Function.';

-- ─── 4. Scheduled Monday snapshot (pg_cron) ──────────────────────────────────
-- Snapshots every user's XP and rank at 00:05 UTC every Monday.
-- Requires the pg_cron extension (enabled by default on Supabase Pro).

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'weekly_xp_snapshot',          -- job name (idempotent)
  '5 0 * * MON',                 -- every Monday at 00:05 UTC
  $$
    INSERT INTO public.weekly_xp_snapshots (user_id, week_start, xp_at_start, rank_at_start)
    SELECT
      user_id,
      DATE_TRUNC('week', NOW())::DATE,
      total_xp,
      DENSE_RANK() OVER (ORDER BY total_xp DESC)::INTEGER
    FROM public.user_profiles
    WHERE total_xp > 0
    ON CONFLICT (user_id, week_start) DO NOTHING;
  $$
);
