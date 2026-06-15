import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FCM_BATCH_SIZE = 500;
const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_ids, type, title, body, data } = await req.json();

    if (!user_ids || !type || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'user_ids, type, title, body required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get FCM tokens for users
    const { data: users } = await supabase
      .from('users')
      .select('id, fcm_token')
      .in('id', user_ids)
      .not('fcm_token', 'is', null);

    const tokens = (users ?? [])
      .map((u: any) => ({ id: u.id, token: u.fcm_token }))
      .filter((u: any) => u.token);

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No tokens found' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fcmKey = Deno.env.get('FCM_SERVER_KEY') ?? '';
    let totalSent = 0;
    const logs: any[] = [];

    // Batch send (500 tokens per request)
    for (let i = 0; i < tokens.length; i += FCM_BATCH_SIZE) {
      const batch = tokens.slice(i, i + FCM_BATCH_SIZE);
      const batchTokens = batch.map((t: any) => t.token);

      const fcmRes = await fetch(FCM_URL, {
        method: 'POST',
        headers: {
          'Authorization': `key=${fcmKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registration_ids: batchTokens,
          notification: { title, body },
          data: { type, ...data },
          priority: 'high',
        }),
      });

      if (fcmRes.ok) {
        const fcmData = await fcmRes.json();
        totalSent += batch.length;

        // Log notifications
        batch.forEach((t: any) => {
          logs.push({
            push_id: fcmData.multicast_id?.toString(),
            user_id: t.id,
            type,
            title,
            body,
            data: data ?? {},
          });
        });
      }
    }

    // Store notification logs
    if (logs.length > 0) {
      await supabase.from('notification_logs').insert(logs);
    }

    // Also store in-app notifications
    const inAppNotifications = (users ?? []).map((u: any) => ({
      user_id: u.id,
      title,
      body,
      type,
      is_read: false,
    }));

    if (inAppNotifications.length > 0) {
      await supabase.from('notifications').insert(inAppNotifications);
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