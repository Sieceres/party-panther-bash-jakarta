import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const promoTool = {
  type: "function" as const,
  function: {
    name: "extract_promos",
    description: "Extract all promotional offers found in the content. Each promo should be a separate item.",
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
              promo_type: { type: "string", enum: ["Happy Hour", "Ladies Night", "Free Flow", "Bottle Promo", "Beer Deal", "Brunch Deal", "Food Special", "Drink Special", "Live Music", "Other"], description: "MUST be one of the enum values." },
              day_of_week: { type: "array", items: { type: "string" }, description: "Days this promo is active" },
              area: { type: "string", description: "Specific neighborhood/area." },
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
    description: "Extract all events found in the content. Each event should be a separate item.",
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

const contactTool = {
  type: "function" as const,
  function: {
    name: "extract_contacts",
    description: "Extract all venue/business contact information found in the content. Each venue should be a separate item.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              venue_name: { type: "string", description: "Name of the venue/bar/restaurant/business" },
              instagram: { type: "string", description: "Instagram handle (without @)" },
              whatsapp: { type: "string", description: "WhatsApp number in international format" },
              website: { type: "string", description: "Website URL if visible" },
              google_maps_link: { type: "string", description: "Google Maps link if visible" },
              opening_hours: { type: "string", description: "Opening hours text if visible" },
              address: { type: "string", description: "Address if visible" },
            },
            required: ["venue_name"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

const venueTool = {
  type: "function" as const,
  function: {
    name: "extract_venues",
    description: "Extract all venue/bar/restaurant/club information found in the content. Each venue should be a separate item.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Name of the venue/bar/restaurant/club" },
              address: { type: "string", description: "Full address if available" },
              area: { type: "string", description: "Neighborhood/area (e.g. Kemang, Senopati, SCBD, Menteng)" },
              description: { type: "string", description: "Brief description of the venue" },
              instagram: { type: "string", description: "Instagram handle (without @)" },
              whatsapp: { type: "string", description: "WhatsApp number in international format (+62...)" },
              website: { type: "string", description: "Website URL" },
              google_maps_link: { type: "string", description: "Google Maps link" },
              opening_hours: { type: "string", description: "Opening hours text" },
            },
            required: ["name"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
};

function extractJsonFromText(text: string): any | null {
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch { /* continue */ }
  }
  const jsonMatch = text.match(/\{[\s\S]*"items"[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch { /* continue */ }
  }
  try { return JSON.parse(text); } catch { /* continue */ }
  return null;
}

function getToolConfig(type: string) {
  switch (type) {
    case "venue": return { tool: venueTool, name: "extract_venues" };
    case "contact": return { tool: contactTool, name: "extract_contacts" };
    case "promo": return { tool: promoTool, name: "extract_promos" };
    default: return { tool: eventTool, name: "extract_events" };
  }
}

function getSystemPrompt(type: string): string {
  switch (type) {
    case "venue":
      return `You are an expert at extracting venue/bar/restaurant/club information from images and text.
Extract ALL venues you can find. Each venue should be a separate item.
Look for venue names, addresses, neighborhoods/areas, Instagram handles, WhatsApp numbers, websites, Google Maps links, and opening hours.
For Instagram, remove the @ symbol and just return the handle.
For WhatsApp/phone numbers, convert to international format (+62...) if they start with 0.
For area, try to identify the Jakarta neighborhood (e.g. Kemang, Senopati, SCBD, Menteng, Kuningan, PIK, Kelapa Gading).
Be thorough — extract everything visible.
You MUST use the extract_venues tool to return the results.`;
    case "contact":
      return `You are an expert at extracting contact information for venues, bars, restaurants, and businesses from images and documents.
Extract ALL venue contact details you can find. Each venue should be a separate item.
Look for Instagram handles (with or without @), WhatsApp numbers, phone numbers (especially Indonesian +62 format), websites, Google Maps links, addresses, and opening hours.
For Instagram, remove the @ symbol and just return the handle.
For WhatsApp/phone numbers, convert to international format (+62...) if they start with 0.
Be thorough — extract everything visible.
You MUST use the extract_contacts tool to return the results.`;
    case "promo":
      return `You are an expert at extracting promotional offers from images and documents. 
Extract ALL promos/deals you can find. Each venue+deal combination should be a separate item.
If a venue has promos on different days, create separate items for each day or group days together.
If you see a weekly schedule grid, extract every cell that contains a promo.
Be thorough — extract everything visible. Use "description" to add any extra context.
For discount_text, be specific (e.g. "Buy 1 Get 1 Free", "50% off all drinks", "IDR 50k cocktails").
Default currency is IDR unless otherwise specified.

IMPORTANT - Drink categorization:
For drink_type, categorize drinks specifically:
- Beer brands → ["Beer"]
- Spirits → ["Spirits"]
- Wine → ["Wine"]
- Cocktails → ["Cocktails"]
- Coffee/Tea → ["Coffee & Tea"]
- If multiple types, list all applicable categories.
- If it's a food deal, use ["Food"].

You MUST use the extract_promos tool to return the results.`;
    default:
      return `You are an expert at extracting event information from images and documents.
Extract ALL events you can find. Each event should be a separate item.
Be thorough — extract everything visible. Use ISO date format (YYYY-MM-DD) for dates and 24h format (HH:MM) for times.
You MUST use the extract_events tool to return the results.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { image, text, type } = await req.json();

    if (!image && !text) {
      return new Response(JSON.stringify({ error: "No image or text provided" }), {
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

    const { tool, name: toolName } = getToolConfig(type);
    const systemPrompt = getSystemPrompt(type);
    const typeLabel = type === "venue" ? "venues" : type === "contact" ? "venue contact details" : type === "promo" ? "promos/deals" : "events";

    console.log(`Starting extraction for type: ${type}, mode: ${image ? "image" : "text"}`);

    // Build user message content based on whether it's image or text
    const userContent = image
      ? [
          { type: "text", text: `Extract all ${typeLabel} from this image.` },
          { type: "image_url", image_url: { url: image } },
        ]
      : [
          { type: "text", text: `Extract all ${typeLabel} from the following text:\n\n${text}` },
        ];

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
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: toolName } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const respText = await response.text();
      console.error("AI gateway error:", status, respText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: `AI extraction failed (${status})` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    let items: any[] = [];

    const toolCall = message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      items = parsed.items || [];
    } else if (message?.content) {
      const parsed = extractJsonFromText(message.content);
      if (parsed?.items) items = parsed.items;
      else if (Array.isArray(parsed)) items = parsed;
    }

    console.log(`Extracted ${items.length} ${type} items`);

    return new Response(JSON.stringify({ items: items.length ? items : [], ...(items.length === 0 ? { error: "No items extracted" } : {}) }), {
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
