import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString().split('T')[0];

    // Get all users
    const { data: users } = await supabase
      .from('users')
      .select('id, streak_days, last_active_date');

    let updated = 0;

    for (const user of users ?? []) {
      let newStreak = user.streak_days ?? 0;

      if (user.last_active_date === yesterday) {
        // Active yesterday → increment streak
        newStreak += 1;

        // Award 7-day streak bonus
        if (newStreak % 7 === 0) {
          await supabase.rpc('award_xp', {
            p_user_id: user.id,
            p_event_name: 'streak_7_days',
          });
        }
      } else if (user.last_active_date !== today) {
        // Not active yesterday or today → reset streak
        newStreak = 0;
      }

      await supabase
        .from('users')
        .update({ streak_days: newStreak })
        .eq('id', user.id);

      updated++;
    }

    // Take leaderboard snapshot
    const { data: leaderboard } = await supabase
      .rpc('get_leaderboard', { p_limit: 100 });

    if (leaderboard && leaderboard.length > 0) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const entries = leaderboard.map((entry: any) => ({
        user_id: entry.user_id,
        xp_points: entry.xp_points,
        streak_days: entry.streak_days,
        rank: Number(entry.rank),
        period_type: 'weekly',
        period_start: weekStart.toISOString().split('T')[0],
      }));

      await supabase
        .from('leaderboard_entries')
        .upsert(entries, { onConflict: 'user_id,period_type,period_start' });
    }

    return new Response(
      JSON.stringify({ success: true, users_updated: updated }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});