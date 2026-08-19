const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("GOOGLE_API_KEY") ?? Deno.env.get("GOOGLE_MAPS_BROWSER_KEY") ?? "";

  return new Response(JSON.stringify({ key }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      // Browser keys are public by design; cache to avoid repeat invocations
      "Cache-Control": "public, max-age=3600",
    },
  });
});
