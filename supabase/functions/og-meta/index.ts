import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = "https://partypanther.net";
const DEFAULT_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";
const SITE_NAME = "Party Panther Jakarta";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function absoluteImage(image: string | null | undefined): string {
  if (!image) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${SITE_URL}${image}`;
  return `${SITE_URL}/${image}`;
}

function buildHtml(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
  redirectUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  <meta property="og:image" content="${escapeHtml(meta.image)}" />
  <meta property="og:url" content="${escapeHtml(meta.url)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  <meta name="twitter:image" content="${escapeHtml(meta.image)}" />

  <meta http-equiv="refresh" content="0;url=${escapeHtml(meta.redirectUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(meta.redirectUrl)}">${escapeHtml(meta.title)}</a>...</p>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    // Expected path: /og-meta/{type}/{slug}
    const pathParts = url.pathname.replace(/^\/og-meta\/?/, "").split("/").filter(Boolean);
    const typeRaw = pathParts[0]; // event/e, promo/p, venue/v
    const slug = pathParts.slice(1).join("/");

    // Normalise short aliases
    const typeMap: Record<string, string> = { e: "event", p: "promo", v: "venue", event: "event", promo: "promo", venue: "venue" };
    const type = typeMap[typeRaw];

    if (!type || !slug) {
      return new Response("Missing type or slug", { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let meta = {
      title: SITE_NAME,
      description: "Discover the best Jakarta drink promos, free flow deals and nightlife events.",
      image: DEFAULT_IMAGE,
      url: SITE_URL,
      redirectUrl: SITE_URL,
    };

    if (type === "event") {
      // Try slug first, then id
      let { data } = await supabase
        .from("events")
        .select("title, description, date, time, venue_name, image_url, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) {
        const res = await supabase
          .from("events")
          .select("title, description, date, time, venue_name, image_url, slug")
          .eq("id", slug)
          .maybeSingle();
        data = res.data;
      }

      if (data) {
        meta = {
          title: `${data.title} at ${data.venue_name} — Jakarta Event | Party Panther`,
          description: `${data.title} at ${data.venue_name}, Jakarta on ${data.date}. ${(data.description || "").slice(0, 120)}`,
          image: data.image_url || DEFAULT_IMAGE,
          url: `${SITE_URL}/e/${data.slug || slug}`,
          redirectUrl: `${SITE_URL}/e/${data.slug || slug}`,
        };
      }
    } else if (type === "promo") {
      let { data } = await supabase
        .from("promos")
        .select("title, description, discount_text, venue_name, area, image_url, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) {
        const res = await supabase
          .from("promos")
          .select("title, description, discount_text, venue_name, area, image_url, slug")
          .eq("id", slug)
          .maybeSingle();
        data = res.data;
      }

      if (data) {
        meta = {
          title: `${data.title} at ${data.venue_name} — Jakarta Drink Promo | Party Panther`,
          description: `${data.discount_text} — ${data.title} at ${data.venue_name}${data.area ? ` in ${data.area}` : ""}, Jakarta. ${(data.description || "").slice(0, 120)}`,
          image: data.image_url || DEFAULT_IMAGE,
          url: `${SITE_URL}/p/${data.slug || slug}`,
          redirectUrl: `${SITE_URL}/p/${data.slug || slug}`,
        };
      }
    } else if (type === "venue") {
      let { data } = await supabase
        .from("venues")
        .select("name, description, area, image_url, slug")
        .eq("slug", slug)
        .maybeSingle();

      if (!data) {
        const res = await supabase
          .from("venues")
          .select("name, description, area, image_url, slug")
          .eq("id", slug)
          .maybeSingle();
        data = res.data;
      }

      if (data) {
        meta = {
          title: `${data.name}${data.area ? ` — ${data.area}` : ""} — Jakarta Bar & Club | Party Panther`,
          description: `${data.name}${data.area ? ` in ${data.area}` : ""}, Jakarta. ${(data.description || "").slice(0, 120) || "Discover drink promos, events and more at this Jakarta venue."}`,
          image: data.image_url || DEFAULT_IMAGE,
          url: `${SITE_URL}/v/${data.slug || slug}`,
          redirectUrl: `${SITE_URL}/v/${data.slug || slug}`,
        };
      }
    }

    const html = buildHtml(meta);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("OG meta error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
