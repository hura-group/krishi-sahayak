import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Mark expired listings as expired
    const { data: expired, error: expiredError } = await supabase
      .from('marketplace_listings')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('available_until_date', new Date().toISOString().split('T')[0])
      .not('available_until_date', 'is', null)
      .select('id, title, user_id');

    if (expiredError) throw expiredError;

    // Notify owners about expired listings
    if (expired && expired.length > 0) {
      const notifications = expired.map((listing: any) => ({
        user_id: listing.user_id,
        title: '⏰ Listing Expired',
        body: `Your listing "${listing.title}" has expired. Renew it to keep selling.`,
        type: 'listing_expired',
        is_read: false,
      }));

      await supabase.from('notifications').insert(notifications);
    }

    // Clean up old search trends (older than 30 days)
    await supabase
      .from('search_trends')
      .delete()
      .lt(
        'last_searched_at',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expired?.length ?? 0,
      }),
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