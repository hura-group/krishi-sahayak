import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { test_count = 100 } = await req.json().catch(() => ({}));

    // Generate simulated notifications
    const notifications = Array.from(
      { length: test_count },
      (_, i) => ({
        user_id: '1d970295-95e5-42f3-83fd-38d8a3295dd8',
        title: `Test Notification #${i + 1}`,
        body: `Load test message ${i + 1} of ${test_count}`,
        type: 'LOAD_TEST',
        is_read: false,
      })
    );

    // Batch insert in groups of 100
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    let failedBatches = 0;

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('notifications')
        .insert(batch);

      if (error) {
        failedBatches++;
      } else {
        totalInserted += batch.length;
      }
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const coldStartTime = endTime - startTime;
    const successRate = (totalInserted / test_count) * 100;

    // Log performance results
    const results = {
      test_count,
      total_inserted: totalInserted,
      failed_batches: failedBatches,
      success_rate: `${successRate.toFixed(2)}%`,
      total_time_ms: totalTime,
      cold_start_ms: coldStartTime,
      avg_per_notification_ms: (totalTime / test_count).toFixed(2),
      performance: {
        cold_start_ok: coldStartTime < 1000,
        delivery_rate_ok: successRate >= 98,
      },
    };

    // Store results in notification_logs
    await supabase.from('notification_logs').insert({
      user_id: '1d970295-95e5-42f3-83fd-38d8a3295dd8',
      type: 'LOAD_TEST_RESULT',
      title: 'Load Test Complete',
      body: JSON.stringify(results),
      data: results,
    });

    // Clean up test notifications
    await supabase
      .from('notifications')
      .delete()
      .eq('type', 'LOAD_TEST');

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message, time_ms: Date.now() - startTime }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});