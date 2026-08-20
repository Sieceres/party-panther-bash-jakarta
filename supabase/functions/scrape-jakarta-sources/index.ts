import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SourceDef = {
  id: string;
  name: string;
  url: string;
  type: "event" | "promo" | "both";
};

const SOURCES: SourceDef[] = [
  { id: "indoparty", name: "IndoParty", url: "https://www.indoparty.id/Events", type: "event" },
  { id: "tan_delulu", name: "TAN Group – Delulu", url: "https://tangroup.id/outlet/delulu/", type: "both" },
  { id: "vault", name: "Vault Jakarta", url: "https://vault-jakarta.com/", type: "event" },
  { id: "hop", name: "See You at the Hop", url: "https://seeyouatthehop.com/programme", type: "both" },
  { id: "pats", name: "Pat's X (Jakarta Party Club)", url: "https://jakartapartyclub.com/nightclub/pats-x/", type: "event" },
];

async function firecrawlScrape(url: string, apiKey: string): Promise<string | null> {
  const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true }),
  });
  if (!res.ok) {
    console.error("Firecrawl failed", url, res.status, await res.text());
    return null;
  }
  const data = await res.json();
  return data?.data?.markdown ?? data?.markdown ?? null;
}

async function extractFromText(
  text: string,
  type: "event" | "promo",
  lovableKey: string,
): Promise<any[]> {
  const tool = type === "event"
    ? {
        type: "function" as const,
        function: {
          name: "extract_events",
          description: "Extract events from the text",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    date: { type: "string", description: "YYYY-MM-DD" },
                    time: { type: "string", description: "HH:MM 24h" },
                    venue_name: { type: "string" },
                    venue_address: { type: "string" },
                    organizer_name: { type: "string" },
                    organizer_whatsapp: { type: "string" },
                  },
                  required: ["title"],
                },
              },
            },
            required: ["items"],
          },
        },
      }
    : {
        type: "function" as const,
        function: {
          name: "extract_promos",
          description: "Extract recurring DRINK deals (not events) from text",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    venue_name: { type: "string" },
                    venue_address: { type: "string" },
                    discount_text: { type: "string", description: "The concrete drink offer, e.g. 'Buy 1 Get 1 cocktails' or 'Beer bucket 5 for 200k'" },
                    promo_type: { type: "string", enum: ["Happy Hour", "Ladies Night", "Free Flow", "Bottle Promo", "Beer Deal", "Other"] },
                    day_of_week: { type: "array", items: { type: "string", enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] } },
                    drink_type: { type: "array", items: { type: "string", enum: ["Beer", "Wine", "Cocktail", "Spirits", "Non-Alcoholic", "Mixed"] } },
                  },
                  required: ["title", "venue_name", "discount_text"],
                },
              },
            },
            required: ["items"],
          },
        },
      };

  const currentYear = new Date().getUTCFullYear();
  const sys = type === "event"
    ? `Extract upcoming events in Jakarta from this content. Be thorough but skip generic boilerplate. If a date shows day/month without year, assume ${currentYear} (or ${currentYear + 1} if already past). 24h time, ISO date.`
    : `You extract PROMOS for a Jakarta nightlife app. A promo is strictly a recurring DRINK offer at a venue: happy hour, ladies night, free flow, bottle promo, beer deal / bucket, buy-1-get-1 on drinks, discounted drink pricing.

STRICT RULES:
- NEVER return one-off events, parties, DJ line-ups, concerts, guest sets, festivals, holiday parties or anything tied to a single calendar date. Those are events, not promos.
- If an item has a specific single date, an artist/DJ name, a ticket price, or a line-up, SKIP it.
- Only include an item if it names a concrete drink deal with drinks and a price/discount. No food-only deals, no generic "great vibes" marketing, no venue descriptions.
- Each promo + day combination is a separate item. Use the recurring weekdays it runs on.
- If the content contains no qualifying drink deals, return an empty items array.`;

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: text.slice(0, 30000) },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: tool.function.name } },
    }),
  });
  if (!resp.ok) {
    console.error("AI gateway failed", resp.status, await resp.text());
    return [];
  }
  const data = await resp.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) return [];
  try {
    const parsed = JSON.parse(call.function.arguments);
    return parsed.items || [];
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Open for testing: no auth required to run a scrape.
    // Approving scraped items still requires admin (enforced by RLS).


    const body = await req.json().catch(() => ({}));
    const requested: string[] | undefined = body?.sources;

    const fcKey = Deno.env.get("FIRECRAWL_API_KEY");
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!fcKey || !lovableKey) {
      return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY or LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const targets = requested?.length
      ? SOURCES.filter((s) => requested.includes(s.id))
      : SOURCES;

    const summary: any[] = [];

    for (const src of targets) {
      const md = await firecrawlScrape(src.url, fcKey);
      if (!md) {
        summary.push({ source: src.id, ok: false, error: "scrape_failed" });
        continue;
      }

      const types: ("event" | "promo")[] = src.type === "both" ? ["event", "promo"] : [src.type];
      let inserted = 0;
      for (const t of types) {
        const items = await extractFromText(md, t, lovableKey);
        if (!items.length) continue;
        const rows = items.map((it: any) => ({
          source: src.name,
          source_url: src.url,
          item_type: t,
          raw_data: it,
          status: "pending",
        }));
        const { error } = await admin.from("pending_scraped_items").insert(rows);
        if (error) {
          console.error("Insert failed", error);
        } else {
          inserted += rows.length;
        }
      }
      summary.push({ source: src.id, ok: true, inserted });
    }

    return new Response(JSON.stringify({ summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scrape-jakarta-sources error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
