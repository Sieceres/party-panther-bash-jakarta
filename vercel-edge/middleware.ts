import { next } from "@vercel/edge";

export const config = {
  matcher: "/((?!_next/|favicon.ico).*)",
};

const CRAWLER_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|Slack-ImgProxy|TelegramBot|Discordbot|Pinterest|redditbot|Applebot|SkypeUriPreview|vkShare|W3C_Validator|Iframely|Googlebot|bingbot|preview/i;

const TYPE_MAP: Record<string, string> = {
  e: "e",
  event: "e",
  p: "p",
  promo: "p",
  v: "v",
  venue: "v",
};

const OG_ENDPOINT =
  "https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/og-meta";
const ORIGIN = "https://partypanther.lovable.app";

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";
  const isCrawler = CRAWLER_RE.test(ua);

  // Match /{prefix}/{slug}
  const match = url.pathname.match(/^\/([^\/]+)\/([^\/?#]+)/);
  const prefix = match?.[1]?.toLowerCase();
  const slug = match?.[2];
  const type = prefix ? TYPE_MAP[prefix] : null;

  // 1. Crawler hitting a share URL → return OG HTML from Supabase
  if (isCrawler && type && slug) {
    try {
      const ogUrl = `${OG_ENDPOINT}?type=${type}&slug=${encodeURIComponent(slug)}`;
      const ogRes = await fetch(ogUrl, {
        headers: { "user-agent": ua },
      });
      if (ogRes.ok) {
        const html = await ogRes.text();
        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300, s-maxage=300",
            "x-og-source": "vercel-edge",
          },
        });
      }
    } catch (_err) {
      // fall through to origin proxy
    }
  }

  // 2. Everyone else → transparent proxy to Lovable origin
  const originUrl = `${ORIGIN}${url.pathname}${url.search}`;
  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set("host", "partypanther.lovable.app");
  proxyHeaders.set("x-forwarded-host", url.host);
  proxyHeaders.set("x-forwarded-proto", "https");

  const proxyReq = new Request(originUrl, {
    method: request.method,
    headers: proxyHeaders,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : request.body,
    redirect: "manual",
  });

  const originRes = await fetch(proxyReq);

  // Strip hop-by-hop headers; pass everything else through
  const resHeaders = new Headers(originRes.headers);
  resHeaders.delete("content-encoding");
  resHeaders.delete("content-length");
  resHeaders.set("x-proxied-by", "vercel-edge");

  return new Response(originRes.body, {
    status: originRes.status,
    statusText: originRes.statusText,
    headers: resHeaders,
  });
}