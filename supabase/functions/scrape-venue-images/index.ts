const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Extract Instagram handle from page content/links
function extractInstagram(markdown: string, links: string[]): string | null {
  // Check links for instagram.com profile URLs
  for (const link of links) {
    const match = link.match(/instagram\.com\/([a-zA-Z0-9_.]+)\/?$/);
    if (match && !['p', 'reel', 'explore', 'accounts', 'stories'].includes(match[1])) {
      return `@${match[1]}`;
    }
  }
  // Check markdown for instagram handles or URLs
  const igUrlMatch = markdown.match(/instagram\.com\/([a-zA-Z0-9_.]{2,30})/i);
  if (igUrlMatch && !['p', 'reel', 'explore', 'accounts', 'stories'].includes(igUrlMatch[1])) {
    return `@${igUrlMatch[1]}`;
  }
  return null;
}

// Extract WhatsApp number from page content/links
function extractWhatsApp(markdown: string, links: string[]): string | null {
  // Check links for wa.me or api.whatsapp.com
  for (const link of links) {
    const waMatch = link.match(/wa\.me\/(\+?\d{8,15})/);
    if (waMatch) return waMatch[1];
    const apiMatch = link.match(/api\.whatsapp\.com\/send\?phone=(\+?\d{8,15})/);
    if (apiMatch) return apiMatch[1];
  }
  // Check markdown for WhatsApp links
  const waMarkdown = markdown.match(/wa\.me\/(\+?\d{8,15})/);
  if (waMarkdown) return waMarkdown[1];
  const apiMarkdown = markdown.match(/api\.whatsapp\.com\/send\?phone=(\+?\d{8,15})/);
  if (apiMarkdown) return apiMarkdown[1];
  // Look for Indonesian phone numbers near "whatsapp" keyword
  const waSection = markdown.match(/whatsapp[^]*?(\+?62\d{8,12})/i);
  if (waSection) return waSection[1];
  return null;
}

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

    const { venue_id, venue_ids, batch_size = 10, mode = 'all' } = await req.json();
    // mode: 'images' = only images, 'contacts' = only instagram/whatsapp, 'all' = everything
    const ids = venue_ids || (venue_id ? [venue_id] : []);

    let venues: any[];
    if (ids.length > 0) {
      const { data } = await supabase.from('venues').select('id, name, instagram, website, image_url, whatsapp').in('id', ids);
      venues = data || [];
    } else {
      // Fetch venues that are missing data based on mode
      let query = supabase.from('venues').select('id, name, instagram, website, image_url, whatsapp');
      if (mode === 'images') {
        query = query.is('image_url', null);
      } else if (mode === 'contacts') {
        // Venues missing instagram OR whatsapp that have a website to scrape
        query = query.not('website', 'is', null);
        query = query.or('instagram.is.null,whatsapp.is.null');
      } else {
        // 'all' mode - venues missing any data
        query = query.or('image_url.is.null,instagram.is.null,whatsapp.is.null');
      }
      const { data } = await query.limit(batch_size);
      venues = data || [];
    }

    console.log(`Processing ${venues.length} venues (mode: ${mode})`);

    const results: { venue_id: string; name: string; status: string; found: string[] }[] = [];

    for (const venue of venues) {
      try {
        let imageUrl: string | null = null;
        let instagramHandle: string | null = null;
        let whatsappNumber: string | null = null;
        const foundItems: string[] = [];

        const needImage = !venue.image_url && (mode === 'images' || mode === 'all');
        const needInstagram = !venue.instagram && (mode === 'contacts' || mode === 'all');
        const needWhatsApp = !venue.whatsapp && (mode === 'contacts' || mode === 'all');

        // Scrape website first (richest source for contacts + images)
        if (venue.website && (needImage || needInstagram || needWhatsApp)) {
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
              formats: ['markdown', 'links', 'screenshot'],
              onlyMainContent: false, // full page to catch footer links
              waitFor: 2000,
            }),
          });

          const data = await res.json();
          const markdown = data?.data?.markdown || data?.markdown || '';
          const links: string[] = data?.data?.links || data?.links || [];
          const metadata = data?.data?.metadata || data?.metadata;

          // Extract image
          if (needImage) {
            if (metadata?.ogImage) {
              imageUrl = metadata.ogImage;
            } else if (metadata?.favicon) {
              imageUrl = metadata.favicon;
            }
            if (!imageUrl) {
              const screenshot = data?.data?.screenshot || data?.screenshot;
              if (screenshot && screenshot.startsWith('http')) imageUrl = screenshot;
            }
          }

          // Extract contacts
          if (needInstagram) {
            instagramHandle = extractInstagram(markdown, links);
          }
          if (needWhatsApp) {
            whatsappNumber = extractWhatsApp(markdown, links);
          }
        }

        // Try Instagram for image if we have a handle
        const igHandle = venue.instagram || instagramHandle;
        if (igHandle && needImage && !imageUrl) {
          const handle = igHandle.replace('@', '').trim();
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
          const metadata = data?.data?.metadata || data?.metadata;
          if (metadata?.ogImage) {
            imageUrl = metadata.ogImage;
          }
        }

        // Google search fallback for image
        if (needImage && !imageUrl) {
          console.log(`Searching for image of ${venue.name}`);
          const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: `"${venue.name}" Jakarta bar restaurant`,
              limit: 5,
              scrapeOptions: { formats: ['markdown'] },
            }),
          });

          const searchData = await searchRes.json();
          const searchResults = searchData?.data || [];

          for (const result of searchResults) {
            const meta = result?.metadata;
            if (meta?.ogImage && meta.ogImage.startsWith('http')) {
              imageUrl = meta.ogImage;
              break;
            }
            const md = result?.markdown || '';
            const imgMatch = md.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)[^\s)]*)\)/i);
            if (imgMatch) {
              imageUrl = imgMatch[1];
              break;
            }

            // Also try to extract contacts from search results
            if (needInstagram && !instagramHandle) {
              const links: string[] = [];
              instagramHandle = extractInstagram(md, links);
            }
            if (needWhatsApp && !whatsappNumber) {
              const links: string[] = [];
              whatsappNumber = extractWhatsApp(md, links);
            }
          }
        }

        // Build update object
        const updateData: Record<string, any> = {};
        if (imageUrl && !venue.image_url) {
          updateData.image_url = imageUrl;
          foundItems.push('image');
        }
        if (instagramHandle && !venue.instagram) {
          updateData.instagram = instagramHandle;
          foundItems.push('instagram');
        }
        if (whatsappNumber && !venue.whatsapp) {
          updateData.whatsapp = whatsappNumber;
          foundItems.push('whatsapp');
        }

        if (Object.keys(updateData).length > 0) {
          await supabase.from('venues').update(updateData).eq('id', venue.id);
          results.push({ venue_id: venue.id, name: venue.name, status: 'found', found: foundItems });
          console.log(`✓ ${venue.name}: found ${foundItems.join(', ')}`);
        } else {
          results.push({ venue_id: venue.id, name: venue.name, status: 'not_found', found: [] });
          console.log(`✗ Nothing new found for ${venue.name}`);
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.error(`Error scraping ${venue.name}:`, err);
        results.push({ venue_id: venue.id, name: venue.name, status: 'error', found: [] });
      }
    }

    const foundCount = results.filter(r => r.status === 'found').length;
    const imageCount = results.filter(r => r.found.includes('image')).length;
    const igCount = results.filter(r => r.found.includes('instagram')).length;
    const waCount = results.filter(r => r.found.includes('whatsapp')).length;

    console.log(`Done: ${foundCount}/${results.length} venues enriched (${imageCount} images, ${igCount} instagram, ${waCount} whatsapp)`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { total: results.length, found: foundCount, images: imageCount, instagram: igCount, whatsapp: waCount },
      }),
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
