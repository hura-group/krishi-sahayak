import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FCM_BATCH_SIZE = 500;

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { article_id, state } = await req.json();

    if (!article_id) {
      return new Response(
        JSON.stringify({ error: 'article_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get article details
    const { data: article, error: articleError } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', article_id)
      .single();

    if (articleError || !article) {
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get FCM tokens for users in affected state
    let userQuery = supabase
      .from('users')
      .select('fcm_token')
      .not('fcm_token', 'is', null);

    if (state) {
      userQuery = userQuery.eq('state', state);
    }

    const { data: users } = await userQuery;
    const tokens = (users ?? [])
      .map((u: any) => u.fcm_token)
      .filter(Boolean);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No tokens found', sent: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Batch send FCM messages (500 per batch)
    const fcmKey = Deno.env.get('FCM_SERVER_KEY') ?? '';
    let totalSent = 0;

    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const batch = tokens.slice(i, i + FCM_BATCH_SIZE);

      const fcmRes = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${fcmKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_ids: batch,
          notification: {
            title: '🚨 Breaking News',
            body: article.title,
            image: article.image,
          },
          data: {
            article_id: article.id,
            category: article.category,
            url: article.url,
          },
        }),
      });

      if (fcmRes.ok) {
        totalSent += batch.length;
      }
    }

    // Log notification
    await supabase
      .from('push_notifications_log')
      .insert({
        article_id,
        state: state ?? 'all',
        tokens_sent: totalSent,
      });

    // Insert notification record for each user
    const notificationRecords = (users ?? [])
      .filter((u: any) => u.fcm_token)
      .map((u: any) => ({
        user_id: u.id,
        title: '🚨 Breaking News',
        body: article.title,
        type: 'breaking_news',
        is_read: false,
      }));

    if (notificationRecords.length > 0) {
      await supabase
        .from('notifications')
        .insert(notificationRecords);
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent }),
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