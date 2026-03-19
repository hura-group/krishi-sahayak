import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch farming news
    const apiKey = Deno.env.get("NEWS_API_KEY")!;
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=farming+india+agriculture&language=en&pageSize=10&apiKey=${apiKey}`
    );
    const data = await res.json();

    return new Response(
      JSON.stringify({ success: true, articles: data.articles?.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});