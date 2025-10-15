import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const query = url.searchParams.get('q');
    const lat = url.searchParams.get('lat');
    const lon = url.searchParams.get('lon');
    const limit = url.searchParams.get('limit') || '10';
    const osm_tag = url.searchParams.get('osm_tag');

    let photonUrl: string;

    if (type === 'reverse') {
      // Reverse geocoding
      if (!lat || !lon) {
        return new Response(
          JSON.stringify({ error: 'Missing lat or lon for reverse geocoding' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      photonUrl = `https://photon.komoot.io/api/reverse?lat=${lat}&lon=${lon}&limit=${limit}`;
    } else {
      // Forward geocoding (search)
      if (!query) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameter' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      const params = new URLSearchParams({
        q: query,
        limit: limit,
      });
      
      if (lat && lon) {
        params.append('lat', lat);
        params.append('lon', lon);
      }
      
      if (osm_tag) {
        params.append('osm_tag', osm_tag);
      }
      
      photonUrl = `https://photon.komoot.io/api/?${params.toString()}`;
    }

    console.log('Proxying request to Photon:', photonUrl);

    const response = await fetch(photonUrl);
    
    if (!response.ok) {
      console.error('Photon API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Photon API request failed', status: response.status }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log(`Photon returned ${data.features?.length || 0} results`);

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in photon-proxy function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
