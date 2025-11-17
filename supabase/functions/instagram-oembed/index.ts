import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OEmbedResponse {
  html?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing Instagram URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate Instagram URL
    if (!url.includes('instagram.com')) {
      return new Response(
        JSON.stringify({ error: 'URL must be an Instagram URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize URL: ensure it ends with /
    const normalizedUrl = url.endsWith('/') ? url : `${url}/`;

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[instagram-oembed] Processing request for URL: ${normalizedUrl}`);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('instagram_oembed_cache')
      .select('oembed_html, expires_at')
      .eq('instagram_url', normalizedUrl)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cacheError) {
      console.error('[instagram-oembed] Cache lookup error:', cacheError);
    }

    if (cached?.oembed_html) {
      console.log(`[instagram-oembed] Cache hit for ${normalizedUrl}`);
      return new Response(
        JSON.stringify({ html: cached.oembed_html, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[instagram-oembed] Cache miss, fetching from Instagram API`);

    // Fetch from Instagram oEmbed API via Facebook Graph
    const instagramAppId = Deno.env.get('INSTAGRAM_APP_ID');
    const instagramAppSecret = Deno.env.get('INSTAGRAM_APP_SECRET');

    if (!instagramAppId || !instagramAppSecret) {
      console.error('[instagram-oembed] Missing Instagram credentials');
      return new Response(
        JSON.stringify({ error: 'Instagram API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Facebook Graph API oEmbed endpoint
    const accessToken = `${instagramAppId}|${instagramAppSecret}`;
    const oembedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(normalizedUrl)}&access_token=${accessToken}&omitscript=true&maxwidth=540`;

    console.log(`[instagram-oembed] Fetching from Facebook Graph API`);

    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[instagram-oembed] Facebook Graph API error:`, errorText);
      return new Response(
        JSON.stringify({ error: `Instagram API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data: OEmbedResponse = await response.json();

    if (!data.html) {
      console.error('[instagram-oembed] No HTML in oEmbed response');
      return new Response(
        JSON.stringify({ error: 'No embed HTML returned from Instagram' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[instagram-oembed] Successfully fetched embed HTML`);

    // Cache the result for 7 days
    const { error: insertError } = await supabase
      .from('instagram_oembed_cache')
      .upsert({
        instagram_url: normalizedUrl,
        oembed_html: data.html,
        cached_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'instagram_url'
      });

    if (insertError) {
      console.error('[instagram-oembed] Cache insert error:', insertError);
    } else {
      console.log(`[instagram-oembed] Cached result for ${normalizedUrl}`);
    }

    return new Response(
      JSON.stringify({ html: data.html, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[instagram-oembed] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
