import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Static price data (since govt API is blocked)
    const records = [
      { crop_name: "Wheat", price_per_kg: 22.50, market_name: "Ahmedabad APMC", state: "Gujarat" },
      { crop_name: "Rice", price_per_kg: 35.00, market_name: "Surat APMC", state: "Gujarat" },
      { crop_name: "Cotton", price_per_kg: 65.00, market_name: "Rajkot APMC", state: "Gujarat" },
      { crop_name: "Groundnut", price_per_kg: 55.00, market_name: "Junagadh APMC", state: "Gujarat" },
      { crop_name: "Onion", price_per_kg: 18.00, market_name: "Mehsana APMC", state: "Gujarat" },
    ];

    const { error } = await supabase
      .from("market_prices")
      .insert(records);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, inserted: records.length }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});