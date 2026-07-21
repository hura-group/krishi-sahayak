import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async () => {
  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check database connection
    const { error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return new Response(
        JSON.stringify({
          status: 'degraded',
          database: 'error',
          response_time_ms: responseTime,
          error: error.message,
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        status: 'ok',
        database: 'connected',
        response_time_ms: responseTime,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        status: 'error',
        message,
        response_time_ms: Date.now() - startTime,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});