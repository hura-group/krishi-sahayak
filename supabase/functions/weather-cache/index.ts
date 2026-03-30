import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { lat, lng } = await req.json();

    // Check cache first (< 30 minutes old)
    const { data: cached } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('lat', lat)
      .eq('lng', lng)
      .gte('fetched_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .single();

    // Return cached data if available
    if (cached) {
      return new Response(
        JSON.stringify({ source: 'cache', data: cached.data }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fresh data from OpenWeatherMap
    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    if (!weatherRes.ok) {
      // Return last known data gracefully if API is down
      const { data: lastKnown } = await supabase
        .from('weather_cache')
        .select('*')
        .eq('lat', lat)
        .eq('lng', lng)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

      if (lastKnown) {
        return new Response(
          JSON.stringify({ source: 'last_known', data: lastKnown.data }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }

      throw new Error('Weather API is down and no cached data available');
    }

    const weatherData = await weatherRes.json();

    // Delete old cache for this location
    await supabase
      .from('weather_cache')
      .delete()
      .eq('lat', lat)
      .eq('lng', lng);

    // Store fresh data in cache
    await supabase
      .from('weather_cache')
      .insert({
        lat,
        lng,
        data: weatherData,
        fetched_at: new Date().toISOString(),
      });

    return new Response(
      JSON.stringify({ source: 'api', data: weatherData }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});