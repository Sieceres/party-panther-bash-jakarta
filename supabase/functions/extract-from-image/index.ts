import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const promoTool = {
  type: "function" as const,
  function: {
    name: "extract_promos",
    description: "Extract all promotional offers found in the image/document. Each promo should be a separate item.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Promo title, e.g. 'Happy Hour at Bar X'" },
              description: { type: "string", description: "Brief description of the promo" },
              venue_name: { type: "string", description: "Name of the venue/bar/restaurant" },
              venue_address: { type: "string", description: "Address if visible" },
              discount_text: { type: "string", description: "The discount/deal text, e.g. '2-for-1 cocktails' or '50% off'" },
              promo_type: { type: "string", description: "Type: happy_hour, ladies_night, brunch_deal, food_special, drink_special, live_music, other" },
              day_of_week: { type: "array", items: { type: "string" }, description: "Days this promo is active: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday" },
              area: { type: "string", description: "Specific neighborhood/area. Must be one of: Kemang, Senopati & Gunawarman, SCBD, Senayan, Blok M & Melawai, Sudirman & Thamrin, Kuningan & Setiabudi, Mega Kuningan, Menteng & Cikini, Kota Tua, PIK, Kelapa Gading, Ancol, Grogol, Kebon Jeruk, Kelapa Gading Timur. Pick the closest match." },
              drink_type: { type: "array", items: { type: "string" }, description: "Types of drinks if applicable" },
              original_price_amount: { type: "number", description: "Original price if visible" },
              discounted_price_amount: { type: "number", description: "Discounted price if visible" },
              price_currency: { type: "string", description: "Currency code, default IDR" },
              category: { type: "string", description: "Category: bar, club, restaurant, cafe, hotel, rooftop, beach_club, other" },
            },
            required: ["title", "venue_name", "discount_text"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

const eventTool = {
  type: "function" as const,
  function: {
    name: "extract_events",
    description: "Extract all events found in the image/document. Each event should be a separate item.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Event title" },
              description: { type: "string", description: "Brief description" },
              date: { type: "string", description: "Date in YYYY-MM-DD format if visible" },
              time: { type: "string", description: "Time in HH:MM format if visible" },
              venue_name: { type: "string", description: "Venue name" },
              venue_address: { type: "string", description: "Venue address if visible" },
              organizer_name: { type: "string", description: "Organizer name if visible" },
              price_currency: { type: "string", description: "Currency code, default IDR" },
            },
            required: ["title"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

// Try to extract JSON from text content (fallback when tool_calls not used)
function extractJsonFromText(text: string): any | null {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* continue */ }
  }

  // Try to find raw JSON object/array
  const jsonMatch = text.match(/\{[\s\S]*"items"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* continue */ }
  }

  // Try the whole text as JSON
  try {
    return JSON.parse(text);
  } catch { /* continue */ }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, type } = await req.json();

    if (!image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isPromo = type === "promo";
    const tool = isPromo ? promoTool : eventTool;
    const toolName = isPromo ? "extract_promos" : "extract_events";

    const systemPrompt = isPromo
      ? `You are an expert at extracting promotional offers from images and documents. 
Extract ALL promos/deals you can find. Each venue+deal combination should be a separate item.
If a venue has promos on different days, create separate items for each day or group days together.
If you see a weekly schedule grid, extract every cell that contains a promo.
Be thorough — extract everything visible. Use "description" to add any extra context.
For discount_text, be specific (e.g. "Buy 1 Get 1 Free", "50% off all drinks", "IDR 50k cocktails").
Default currency is IDR unless otherwise specified.

IMPORTANT - Drink categorization:
For drink_type, categorize drinks specifically:
- Beer brands (Heineken, Bintang, Corona, Tiger, etc.) → ["Beer"]
- Spirits (Vodka, Gin, Rum, Whiskey, Tequila, etc.) → ["Spirits"]
- Wine (Red wine, White wine, Prosecco, Champagne) → ["Wine"]
- Cocktails (Mojito, Margarita, Martini, etc.) → ["Cocktails"]
- Coffee/Tea → ["Coffee & Tea"]
- If multiple types, list all applicable categories.
- If it's a food deal, use ["Food"].
- Be specific about brand names in the description but use broad categories for drink_type.

You MUST use the extract_promos tool to return the results.`
      : `You are an expert at extracting event information from images and documents.
Extract ALL events you can find. Each event should be a separate item.
Be thorough — extract everything visible. Use ISO date format (YYYY-MM-DD) for dates and 24h format (HH:MM) for times.
You MUST use the extract_events tool to return the results.`;

    console.log(`Starting extraction for type: ${type}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract all ${isPromo ? "promos/deals" : "events"} from this image. Be thorough and extract every item you can find.` },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI extraction failed (${status})` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("AI response keys:", Object.keys(data));
    console.log("Choice finish_reason:", data.choices?.[0]?.finish_reason);
    
    const message = data.choices?.[0]?.message;
    let items: any[] = [];

    // Try tool_calls first
    const toolCall = message?.tool_calls?.[0];
    if (toolCall) {
      console.log("Found tool call, parsing arguments");
      const parsed = JSON.parse(toolCall.function.arguments);
      items = parsed.items || [];
    } 
    // Fallback: try parsing from content text
    else if (message?.content) {
      console.log("No tool call found, trying to parse from content text");
      console.log("Content preview:", message.content.substring(0, 200));
      const parsed = extractJsonFromText(message.content);
      if (parsed?.items) {
        items = parsed.items;
      } else if (Array.isArray(parsed)) {
        items = parsed;
      }
    }

    console.log(`Extracted ${items.length} ${type} items`);

    if (items.length === 0) {
      return new Response(JSON.stringify({ error: "No items extracted", items: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-from-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
