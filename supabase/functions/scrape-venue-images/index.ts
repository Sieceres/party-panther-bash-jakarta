const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { venue_id, venue_ids } = await req.json();
    const ids = venue_ids || (venue_id ? [venue_id] : []);

    // If no IDs, fetch all venues missing images
    let venues: any[];
    if (ids.length > 0) {
      const { data } = await supabase.from('venues').select('id, name, instagram, website, image_url').in('id', ids);
      venues = data || [];
    } else {
      const { data } = await supabase.from('venues').select('id, name, instagram, website, image_url')
        .is('image_url', null);
      venues = data || [];
    }

    console.log(`Processing ${venues.length} venues for image scraping`);

    const results: { venue_id: string; name: string; status: string; image_url?: string }[] = [];

    for (const venue of venues) {
      try {
        let imageUrl: string | null = null;

        // Try Instagram first
        if (venue.instagram && !imageUrl) {
          const handle = venue.instagram.replace('@', '').trim();
          const igUrl = `https://www.instagram.com/${handle}/`;
          console.log(`Scraping Instagram for ${venue.name}: ${igUrl}`);

          const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: igUrl,
              formats: ['screenshot', 'links'],
              waitFor: 3000,
            }),
          });

          const data = await res.json();
          const screenshot = data?.data?.screenshot || data?.screenshot;
          
          // Use screenshot as a fallback image if available
          if (screenshot) {
            // Store screenshot as a data URL or upload to storage
            // For now, check if there are any og:image or profile pics in metadata
            const metadata = data?.data?.metadata || data?.metadata;
            if (metadata?.ogImage) {
              imageUrl = metadata.ogImage;
            }
          }

          // Also check metadata for og:image
          const metadata = data?.data?.metadata || data?.metadata;
          if (!imageUrl && metadata?.ogImage) {
            imageUrl = metadata.ogImage;
          }
        }

        // Try website
        if (venue.website && !imageUrl) {
          let websiteUrl = venue.website.trim();
          if (!websiteUrl.startsWith('http')) websiteUrl = `https://${websiteUrl}`;
          console.log(`Scraping website for ${venue.name}: ${websiteUrl}`);

          const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: websiteUrl,
              formats: ['links', 'screenshot'],
              onlyMainContent: true,
              waitFor: 2000,
            }),
          });

          const data = await res.json();
          
          // Check metadata for og:image or favicon
          const metadata = data?.data?.metadata || data?.metadata;
          if (metadata?.ogImage) {
            imageUrl = metadata.ogImage;
          } else if (metadata?.favicon) {
            // Use favicon as last resort - but prefer og:image
            imageUrl = metadata.favicon;
          }

          // Check for screenshot
          if (!imageUrl) {
            const screenshot = data?.data?.screenshot || data?.screenshot;
            if (screenshot && screenshot.startsWith('http')) {
              imageUrl = screenshot;
            }
          }
        }

        // Google search fallback - search for venue name + Jakarta
        if (!imageUrl) {
          console.log(`Searching for image of ${venue.name}`);
          const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `${venue.name} Jakarta bar restaurant`,
              limit: 3,
            }),
          });

          const searchData = await searchRes.json();
          const searchResults = searchData?.data || [];
          
          // Look for og:image in search results
          for (const result of searchResults) {
            const meta = result?.metadata;
            if (meta?.ogImage) {
              imageUrl = meta.ogImage;
              break;
            }
          }
        }

        if (imageUrl) {
          // Update venue with found image
          await supabase.from('venues').update({ image_url: imageUrl }).eq('id', venue.id);
          results.push({ venue_id: venue.id, name: venue.name, status: 'found', image_url: imageUrl });
          console.log(`✓ Found image for ${venue.name}`);
        } else {
          results.push({ venue_id: venue.id, name: venue.name, status: 'not_found' });
          console.log(`✗ No image found for ${venue.name}`);
        }

        // Rate limit: small delay between venues
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error scraping ${venue.name}:`, err);
        results.push({ venue_id: venue.id, name: venue.name, status: 'error' });
      }
    }

    const found = results.filter(r => r.status === 'found').length;
    console.log(`Done: ${found}/${results.length} images found`);

    return new Response(
      JSON.stringify({ success: true, results, summary: { total: results.length, found } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to scrape' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
