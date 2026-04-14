const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Extract Instagram handle from page content/links
function extractInstagram(markdown: string, links: string[]): string | null {
  for (const link of links) {
    const match = link.match(/instagram\.com\/([a-zA-Z0-9_.]+)\/?$/);
    if (match && !['p', 'reel', 'explore', 'accounts', 'stories'].includes(match[1])) {
      return `@${match[1]}`;
    }
  }
  const igUrlMatch = markdown.match(/instagram\.com\/([a-zA-Z0-9_.]{2,30})/i);
  if (igUrlMatch && !['p', 'reel', 'explore', 'accounts', 'stories'].includes(igUrlMatch[1])) {
    return `@${igUrlMatch[1]}`;
  }
  return null;
}

// Extract WhatsApp number from page content/links
function extractWhatsApp(markdown: string, links: string[]): string | null {
  for (const link of links) {
    const waMatch = link.match(/wa\.me\/(\+?\d{8,15})/);
    if (waMatch) return waMatch[1];
    const apiMatch = link.match(/api\.whatsapp\.com\/send\?phone=(\+?\d{8,15})/);
    if (apiMatch) return apiMatch[1];
  }
  const waMarkdown = markdown.match(/wa\.me\/(\+?\d{8,15})/);
  if (waMarkdown) return waMarkdown[1];
  const apiMarkdown = markdown.match(/api\.whatsapp\.com\/send\?phone=(\+?\d{8,15})/);
  if (apiMarkdown) return apiMarkdown[1];
  const waSection = markdown.match(/whatsapp[^]*?(\+?62\d{8,12})/i);
  if (waSection) return waSection[1];
  return null;
}

// Extract Google Maps link from page content/links
function extractGoogleMapsLink(markdown: string, links: string[]): string | null {
  // Check links for Google Maps URLs
  for (const link of links) {
    if (link.match(/google\.\w+\/maps|maps\.google|maps\.app\.goo\.gl|goo\.gl\/maps/i)) {
      return link;
    }
  }
  // Check markdown for Google Maps URLs
  const mapsMatch = markdown.match(/(https?:\/\/(?:www\.)?(?:google\.\w+\/maps\S+|maps\.google\.\w+\S+|maps\.app\.goo\.gl\/\S+|goo\.gl\/maps\/\S+))/i);
  if (mapsMatch) return mapsMatch[1];
  return null;
}

// Extract opening hours from page content
function extractOpeningHours(markdown: string): string | null {
  // Common patterns for opening hours
  const patterns = [
    // "Open: Mon-Sun 10:00-22:00" or "Hours: 10am - 10pm"
    /(?:opening\s*hours?|hours?\s*of\s*operation|business\s*hours?|jam\s*(?:buka|operasional)|waktu\s*operasional)[:\s]*([^\n]{5,100})/i,
    // "Mon-Sun: 10:00 - 22:00" style blocks (capture multiple lines)
    /((?:(?:mon|tue|wed|thu|fri|sat|sun|senin|selasa|rabu|kamis|jumat|sabtu|minggu|weekday|weekend)[\w\s,-]*:\s*\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}[\s\n]*)+)/i,
    // "Daily 10:00 - 22:00" or "Every day 10am-10pm"
    /(?:daily|every\s*day|setiap\s*hari)[:\s]*(\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*[-–]\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?)/i,
    // "Open daily from 10:00 to 22:00"
    /open\s*(?:daily)?\s*(?:from)?\s*(\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*(?:to|[-–])\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?)/i,
    // Simple time range near "open" keyword
    /(?:open|buka)\s*[:.]?\s*(\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2})/i,
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      // Clean up the result
      let hours = match[1].trim().replace(/\n+/g, ', ').replace(/\s{2,}/g, ' ');
      if (hours.length > 200) hours = hours.substring(0, 200);
      return hours;
    }
  }
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
    // mode: 'images' | 'contacts' | 'details' | 'all'
    // 'details' = google maps link + opening hours
    const ids = venue_ids || (venue_id ? [venue_id] : []);

    const selectFields = 'id, name, instagram, website, image_url, whatsapp, opening_hours, google_maps_link, latitude, longitude, address, area';

    let venues: any[];
    if (ids.length > 0) {
      const { data } = await supabase.from('venues').select(selectFields).in('id', ids);
      venues = data || [];
    } else {
      let query = supabase.from('venues').select(selectFields);
      if (mode === 'images') {
        query = query.is('image_url', null);
      } else if (mode === 'contacts') {
        query = query.or('instagram.is.null,whatsapp.is.null');
      } else if (mode === 'details') {
        query = query.or('opening_hours.is.null,google_maps_link.is.null');
      } else {
        query = query.or('image_url.is.null,instagram.is.null,whatsapp.is.null,opening_hours.is.null,google_maps_link.is.null');
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
        let googleMapsLink: string | null = null;
        let openingHours: string | null = null;
        const foundItems: string[] = [];

        const needImage = !venue.image_url && (mode === 'images' || mode === 'all');
        const needInstagram = !venue.instagram && (mode === 'contacts' || mode === 'all');
        const needWhatsApp = !venue.whatsapp && (mode === 'contacts' || mode === 'all');
        const needGMaps = !venue.google_maps_link && (mode === 'details' || mode === 'all');
        const needHours = !venue.opening_hours && (mode === 'details' || mode === 'all');
        const needGeocode = !venue.latitude && !venue.longitude;

        const needAnythingFromWebsite = needImage || needInstagram || needWhatsApp || needGMaps || needHours;

        // Scrape website first (richest source)
        if (venue.website && needAnythingFromWebsite) {
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
              onlyMainContent: false,
              waitFor: 2000,
            }),
          });

          const data = await res.json();
          const markdown = data?.data?.markdown || data?.markdown || '';
          const links: string[] = data?.data?.links || data?.links || [];
          const metadata = data?.data?.metadata || data?.metadata;

          if (needImage) {
            if (metadata?.ogImage) imageUrl = metadata.ogImage;
            else if (metadata?.favicon) imageUrl = metadata.favicon;
            if (!imageUrl) {
              const screenshot = data?.data?.screenshot || data?.screenshot;
              if (screenshot && screenshot.startsWith('http')) imageUrl = screenshot;
            }
          }
          if (needInstagram) instagramHandle = extractInstagram(markdown, links);
          if (needWhatsApp) whatsappNumber = extractWhatsApp(markdown, links);
          if (needGMaps) googleMapsLink = extractGoogleMapsLink(markdown, links);
          if (needHours) openingHours = extractOpeningHours(markdown);
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
          if (metadata?.ogImage) imageUrl = metadata.ogImage;
        }

        // Google search fallback
        const stillNeedImage = needImage && !imageUrl;
        const stillNeedIG = needInstagram && !instagramHandle;
        const stillNeedWA = needWhatsApp && !whatsappNumber;
        const stillNeedGMaps = needGMaps && !googleMapsLink;
        const stillNeedHours = needHours && !openingHours;
        
        if (stillNeedImage || stillNeedIG || stillNeedWA || stillNeedGMaps || stillNeedHours) {
          const searchTerms = [`"${venue.name}" Jakarta`];
          if (stillNeedIG) searchTerms.push('instagram');
          if (stillNeedWA) searchTerms.push('whatsapp');
          if (stillNeedGMaps || stillNeedHours) searchTerms.push('opening hours');
          
          console.log(`Searching for ${venue.name} (need: ${[stillNeedImage && 'image', stillNeedIG && 'instagram', stillNeedWA && 'whatsapp', stillNeedGMaps && 'gmaps', stillNeedHours && 'hours'].filter(Boolean).join(', ')})`);
          
          const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: searchTerms.join(' '),
              limit: 5,
              scrapeOptions: { formats: ['markdown'] },
            }),
          });

          const searchData = await searchRes.json();
          const searchResults = searchData?.data || [];
          console.log(`Search returned ${searchResults.length} results for ${venue.name}`);

          for (const result of searchResults) {
            const meta = result?.metadata;
            const md = result?.markdown || '';
            const resultUrl = result?.url || '';

            // Extract image
            if (stillNeedImage && !imageUrl) {
              if (meta?.ogImage && meta.ogImage.startsWith('http')) {
                imageUrl = meta.ogImage;
              } else {
                const imgMatch = md.match(/!\[.*?\]\((https?:\/\/[^\s)]+\.(?:jpg|jpeg|png|webp)[^\s)]*)\)/i);
                if (imgMatch) imageUrl = imgMatch[1];
              }
            }

            // Extract Instagram
            if (stillNeedIG && !instagramHandle) {
              const urlIgMatch = resultUrl.match(/instagram\.com\/([a-zA-Z0-9_.]{2,30})\/?$/);
              if (urlIgMatch && !['p', 'reel', 'explore', 'accounts', 'stories', 'about'].includes(urlIgMatch[1])) {
                instagramHandle = `@${urlIgMatch[1]}`;
              } else {
                instagramHandle = extractInstagram(md, [resultUrl]);
              }
            }

            // Extract WhatsApp
            if (stillNeedWA && !whatsappNumber) {
              whatsappNumber = extractWhatsApp(md, [resultUrl]);
            }

            // Extract Google Maps link from search results
            if (stillNeedGMaps && !googleMapsLink) {
              // Check if the result URL itself is a Google Maps link
              if (resultUrl.match(/google\.\w+\/maps|maps\.google|maps\.app\.goo\.gl/i)) {
                googleMapsLink = resultUrl;
              } else {
                googleMapsLink = extractGoogleMapsLink(md, [resultUrl]);
              }
            }

            // Extract opening hours from search results
            if (stillNeedHours && !openingHours) {
              openingHours = extractOpeningHours(md);
            }

            // Stop if we found everything
            if ((!stillNeedImage || imageUrl) && (!stillNeedIG || instagramHandle) && 
                (!stillNeedWA || whatsappNumber) && (!stillNeedGMaps || googleMapsLink) && 
                (!stillNeedHours || openingHours)) {
              break;
            }
          }
        }

        // Geocode venue if missing coordinates
        if (needGeocode) {
          try {
            const searchQuery = venue.address
              ? `${venue.name} ${venue.address}`
              : venue.area
                ? `${venue.name} ${venue.area} Jakarta`
                : `${venue.name} Jakarta`;
            const photonParams = new URLSearchParams({
              q: searchQuery,
              limit: '1',
              lat: '-6.2088',
              lon: '106.8456',
            });
            const geoRes = await fetch(`https://photon.komoot.io/api/?${photonParams}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              if (geoData.features?.length > 0) {
                const feature = geoData.features[0];
                const [lng, lat] = feature.geometry.coordinates;
                venue._geocoded = { lat, lng };
                const props = feature.properties;
                const addressParts: string[] = [];
                if (props.name) addressParts.push(props.name);
                if (props.street) addressParts.push(props.street);
                if (props.city) addressParts.push(props.city);
                venue._geocodedAddress = addressParts.join(', ') || null;
                console.log(`Geocoded ${venue.name}: ${lat}, ${lng}`);
              }
            }
          } catch (geoErr) {
            console.error(`Geocoding failed for ${venue.name}:`, geoErr);
          }
        }

        // Build update object
        const updateData: Record<string, any> = {};
        if (imageUrl && !venue.image_url) { updateData.image_url = imageUrl; foundItems.push('image'); }
        if (instagramHandle && !venue.instagram) { updateData.instagram = instagramHandle; foundItems.push('instagram'); }
        if (whatsappNumber && !venue.whatsapp) { updateData.whatsapp = whatsappNumber; foundItems.push('whatsapp'); }
        if (googleMapsLink && !venue.google_maps_link) { updateData.google_maps_link = googleMapsLink; foundItems.push('gmaps'); }
        if (openingHours && !venue.opening_hours) { updateData.opening_hours = openingHours; foundItems.push('hours'); }
        if (venue._geocoded && !venue.latitude) {
          updateData.latitude = venue._geocoded.lat;
          updateData.longitude = venue._geocoded.lng;
          foundItems.push('coordinates');
        }
        if (venue._geocodedAddress && !venue.address) {
          updateData.address = venue._geocodedAddress;
          foundItems.push('address');
        }

        if (Object.keys(updateData).length > 0) {
          await supabase.from('venues').update(updateData).eq('id', venue.id);
          results.push({ venue_id: venue.id, name: venue.name, status: 'found', found: foundItems });
          console.log(`✓ ${venue.name}: found ${foundItems.join(', ')}`);
        } else {
          results.push({ venue_id: venue.id, name: venue.name, status: 'not_found', found: [] });
          console.log(`✗ Nothing new found for ${venue.name}`);
        }

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
    const gmapsCount = results.filter(r => r.found.includes('gmaps')).length;
    const hoursCount = results.filter(r => r.found.includes('hours')).length;
    const coordsCount = results.filter(r => r.found.includes('coordinates')).length;

    console.log(`Done: ${foundCount}/${results.length} venues enriched (${imageCount} images, ${igCount} instagram, ${waCount} whatsapp, ${gmapsCount} gmaps, ${hoursCount} hours, ${coordsCount} coordinates)`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary: { total: results.length, found: foundCount, images: imageCount, instagram: igCount, whatsapp: waCount, gmaps: gmapsCount, hours: hoursCount, coordinates: coordsCount },
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
