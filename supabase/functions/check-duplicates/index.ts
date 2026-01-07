import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DuplicateCheckRequest {
  type: "promo" | "event";
  title: string;
  venue: string;
  description?: string;
  promoType?: string;
  area?: string;
  date?: string;
}

interface ExistingEntry {
  id: string;
  title: string;
  venue_name: string;
  description?: string;
  slug?: string;
  created_at: string;
  creator_name?: string;
  promo_type?: string;
  date?: string;
}

interface DuplicateMatch {
  id: string;
  title: string;
  venue: string;
  slug?: string;
  createdAt: string;
  creatorName?: string;
  confidence: number;
  reason: string;
  date?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, title, venue, description, promoType, area, date } = await req.json() as DuplicateCheckRequest;

    if (!title || !venue) {
      return new Response(
        JSON.stringify({ duplicates: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured", duplicates: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch existing entries to compare against
    let existingEntries: ExistingEntry[] = [];

    if (type === "promo") {
      const { data, error } = await supabase
        .from("promos")
        .select(`
          id,
          title,
          venue_name,
          description,
          slug,
          created_at,
          promo_type,
          area
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching promos:", error);
      } else {
        existingEntries = (data || []).map(p => ({
          id: p.id,
          title: p.title,
          venue_name: p.venue_name,
          description: p.description,
          slug: p.slug,
          created_at: p.created_at,
          promo_type: p.promo_type,
        }));
      }
    } else {
      // Fetch events - focus on recent and upcoming
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          venue_name,
          description,
          slug,
          created_at,
          date
        `)
        .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(50);

      if (error) {
        console.error("Error fetching events:", error);
      } else {
        existingEntries = (data || []).map(e => ({
          id: e.id,
          title: e.title,
          venue_name: e.venue_name,
          description: e.description,
          slug: e.slug,
          created_at: e.created_at,
          date: e.date,
        }));
      }
    }

    if (existingEntries.length === 0) {
      return new Response(
        JSON.stringify({ duplicates: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the AI prompt
    const newEntryInfo = type === "promo"
      ? `NEW PROMO:
Title: "${title}"
Venue: "${venue}"
Description: "${description || "N/A"}"
Promo Type: "${promoType || "N/A"}"
Area: "${area || "N/A"}"`
      : `NEW EVENT:
Title: "${title}"
Venue: "${venue}"
Description: "${description || "N/A"}"
Date: "${date || "N/A"}"`;

    const existingEntriesInfo = existingEntries.map((e, i) => {
      if (type === "promo") {
        return `${i + 1}. ID: ${e.id}
   Title: "${e.title}"
   Venue: "${e.venue_name}"
   Promo Type: "${e.promo_type || "N/A"}"`;
      } else {
        return `${i + 1}. ID: ${e.id}
   Title: "${e.title}"
   Venue: "${e.venue_name}"
   Date: "${e.date || "N/A"}"`;
      }
    }).join("\n\n");

    const systemPrompt = `You are a duplicate detection system for a party/event platform. Your job is to identify if a new ${type} entry is likely a duplicate of an existing one.

Consider these as potential duplicates:
- Same venue with spelling variations (Joe's Bar vs Joes Bar vs Joe's)
- Same offer/event described differently (2-for-1 vs Buy One Get One vs BOGO)
- Same concept with different wording
- Minor typos or case differences

Return a JSON array of matches. Each match should have:
- id: the ID of the existing entry
- confidence: 0-100 percentage (only include if >= 70)
- reason: brief explanation of why this is a match

If no duplicates found, return an empty array: []
Only return the JSON array, no other text.`;

    const userPrompt = `${newEntryInfo}

EXISTING ${type.toUpperCase()}S TO CHECK AGAINST:
${existingEntriesInfo}

Find potential duplicates with confidence >= 70%. Return JSON array only.`;

    console.log("Calling AI for duplicate check...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded", duplicates: [] }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required", duplicates: [] }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error", duplicates: [] }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    console.log("AI response:", content);

    // Parse AI response
    let aiMatches: { id: string; confidence: number; reason: string }[] = [];
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        aiMatches = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      aiMatches = [];
    }

    // Enrich matches with entry details
    const duplicates: DuplicateMatch[] = aiMatches
      .filter(m => m.confidence >= 70)
      .map(match => {
        const entry = existingEntries.find(e => e.id === match.id);
        if (!entry) return null;
        
        return {
          id: entry.id,
          title: entry.title,
          venue: entry.venue_name,
          slug: entry.slug,
          createdAt: entry.created_at,
          creatorName: entry.creator_name,
          confidence: match.confidence,
          reason: match.reason,
          date: entry.date,
        };
      })
      .filter((d): d is DuplicateMatch => d !== null)
      .slice(0, 5); // Limit to top 5 matches

    console.log(`Found ${duplicates.length} potential duplicates`);

    return new Response(
      JSON.stringify({ duplicates }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in check-duplicates:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", duplicates: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
