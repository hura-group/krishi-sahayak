-- =============================================================================
-- supabase/migrations/20260515_000001_create_badges.sql
--
-- Creates the entire Achievement Badges feature schema:
--   1. badges        — master badge catalogue (15 rows seeded below)
--   2. user_badges   — which users have earned which badges
--   3. RLS policies  — safe read/write rules
--   4. Realtime      — enabled on user_badges for live client notifications
--   5. increment_user_xp() RPC — called by the Edge Function to add XP
--
-- Run order: must come after user_profiles migration.
-- =============================================================================

-- ─── Extensions ───────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. badges ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.badges (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           TEXT         NOT NULL UNIQUE,   -- JS constant id, e.g. "first-scan"
  name           TEXT         NOT NULL,
  description    TEXT         NOT NULL,
  icon           TEXT         NOT NULL,          -- Tabler icon class, e.g. "ti-scan"
  color          TEXT         NOT NULL,          -- hex accent colour
  bg_color       TEXT         NOT NULL,          -- hex icon background
  xp_reward      INTEGER      NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  category       TEXT         NOT NULL CHECK (category IN ('farming','social','market','learning','milestone')),
  trigger_action TEXT         NOT NULL,
  criteria       TEXT         NOT NULL,          -- human-readable unlock condition
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.badges              IS 'Master catalogue of achievement badges.';
COMMENT ON COLUMN public.badges.slug         IS 'Stable identifier — used in JS constants and Edge Function logic.';
COMMENT ON COLUMN public.badges.trigger_action IS 'Action key the Edge Function listens for.';

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Anyone can read badge definitions (needed for profile display)
CREATE POLICY "badges_public_read"
  ON public.badges FOR SELECT
  USING (true);

-- Only the service role (Edge Functions) can write badge definitions
CREATE POLICY "badges_service_write"
  ON public.badges FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 2. user_badges ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_badges (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  badge_id    UUID         NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id)
);

COMMENT ON TABLE public.user_badges IS 'Records every badge a user has earned, with timestamp.';

-- Indexes for fast per-user lookups and chronological feed
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id   ON public.user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges (earned_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can read only their own earned badges
CREATE POLICY "user_badges_select_own"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Only the service role (Edge Function) can award badges
CREATE POLICY "user_badges_service_insert"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ─── 3. Realtime ──────────────────────────────────────────────────────────────
-- The useBadgeNotification hook subscribes to this table so the
-- BadgeEarnedModal + confetti fires the instant a new row is inserted.

ALTER PUBLICATION supabase_realtime ADD TABLE public.user_badges;

-- ─── 4. increment_user_xp RPC ────────────────────────────────────────────────
-- Called by the award-badge Edge Function after inserting a new user_badge row.
-- SECURITY DEFINER lets the Edge Function (service role) run it safely.

CREATE OR REPLACE FUNCTION public.increment_user_xp(
  p_user_id UUID,
  p_amount  INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_profiles
     SET total_xp   = COALESCE(total_xp, 0) + p_amount,
         updated_at = NOW()
   WHERE user_id = p_user_id;

  -- Raise notice so Edge Function logs can confirm XP was updated
  RAISE NOTICE 'incremented XP for user % by %', p_user_id, p_amount;
END;
$$;

COMMENT ON FUNCTION public.increment_user_xp IS
  'Safely adds XP to a user profile. Called by the award-badge Edge Function.';

-- ─── 5. Seed — 15 badge definitions ──────────────────────────────────────────

INSERT INTO public.badges
  (slug, name, description, icon, color, bg_color, xp_reward, category, trigger_action, criteria)
VALUES
  (
    'first-scan', 'First Scan',
    'Scanned your first crop or product using the camera.',
    'ti-scan', '#185FA5', '#DBEAFE', 50, 'farming', 'scan',
    'Complete 1 crop scan'
  ),
  (
    'market-watcher', 'Market Watcher',
    'Checked live market prices regularly to stay ahead.',
    'ti-chart-line', '#534AB7', '#EDE9FE', 75, 'market', 'market_view',
    'View market prices 10 times'
  ),
  (
    'community-champion', 'Community Champion',
    'Actively shared knowledge and helped fellow farmers.',
    'ti-users', '#0F6E56', '#D1FAE5', 100, 'social', 'community_post',
    'Post 5 times in the community'
  ),
  (
    'green-streak', 'Green Streak',
    'Kept the momentum alive — logged in 7 days in a row.',
    'ti-flame', '#16A34A', '#DCFCE7', 80, 'milestone', 'login_streak',
    'Maintain a 7-day login streak'
  ),
  (
    'top-seller', 'Top Seller',
    'Listed your first product on the marketplace.',
    'ti-tag', '#EA580C', '#FFEDD5', 60, 'market', 'product_listed',
    'List 1 product for sale'
  ),
  (
    'early-bird', 'Early Bird',
    'One of the first farmers to join the platform.',
    'ti-clock', '#D97706', '#FEF3C7', 200, 'milestone', 'registration',
    'Register within the first 30 days of launch'
  ),
  (
    'knowledge-seeker', 'Knowledge Seeker',
    'Invested in learning — read 10 farming tips and articles.',
    'ti-book', '#4338CA', '#E0E7FF', 90, 'learning', 'article_read',
    'Read 10 articles or farming tips'
  ),
  (
    'weather-wise', 'Weather Wise',
    'Used weather forecasts to plan your farming activities.',
    'ti-cloud', '#0284C7', '#E0F2FE', 50, 'farming', 'weather_check',
    'Check weather forecast 5 times'
  ),
  (
    'harvest-hero', 'Harvest Hero',
    'Logged your very first harvest — the journey begins!',
    'ti-plant', '#15803D', '#DCFCE7', 100, 'farming', 'harvest_logged',
    'Log your first harvest'
  ),
  (
    'price-prophet', 'Price Prophet',
    'Perfectly timed a sale at the predicted market high.',
    'ti-trending-up', '#7C3AED', '#F3E8FF', 150, 'market', 'sale_completed',
    'Sell within 10% of the predicted peak price'
  ),
  (
    'social-butterfly', 'Social Butterfly',
    'Built a thriving network of 10 farmer connections.',
    'ti-heart-handshake', '#DB2777', '#FCE7F3', 120, 'social', 'farmer_connected',
    'Connect with 10 other farmers'
  ),
  (
    'crop-master', 'Crop Master',
    'Diversified your farm by adding 5 different crop varieties.',
    'ti-leaf', '#059669', '#D1FAE5', 110, 'farming', 'crop_added',
    'Add 5 different crops to your profile'
  ),
  (
    'digital-farmer', 'Digital Farmer',
    'Set up a complete profile — name, location, crops, and photo.',
    'ti-star', '#1D4ED8', '#DBEAFE', 75, 'milestone', 'profile_updated',
    'Complete your profile 100%'
  ),
  (
    'milestone-maker', 'Milestone Maker',
    'Reached 1,000 XP — a true farming champion in the making.',
    'ti-trophy', '#CA8A04', '#FEF9C3', 200, 'milestone', 'xp_milestone',
    'Earn a total of 1,000 XP'
  ),
  (
    'legend', 'Legend',
    'Claimed a spot in the Top 10 on the national leaderboard.',
    'ti-crown', '#991B1B', '#FEE2E2', 500, 'milestone', 'leaderboard_rank_updated',
    'Reach the Top 10 on the All India leaderboard'
  )
ON CONFLICT (slug) DO NOTHING;
