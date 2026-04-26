## Goal

Restore pretty share URLs (`partypanther.net/e/...`, `/p/...`, `/v/...`) with working Facebook/WhatsApp/Twitter previews — without Cloudflare and without exposing the `supabase.co` URL. All development continues in Lovable; Vercel is just a thin proxy layer.

## How it will work

```text
                         partypanther.net
                                │
                                ▼
                       ┌────────────────┐
                       │  Vercel Edge   │  ← middleware.ts inspects each request
                       │  Middleware    │
                       └────────────────┘
                          │           │
         crawler + /e,/p,/v│           │everything else
                          ▼           ▼
            Supabase og-meta    partypanther.lovable.app
            (OG HTML response)  (real app, transparent proxy)
```

- Real users never notice Vercel exists; URL stays `partypanther.net/...`.
- Crawlers (facebookexternalhit, WhatsApp, Twitterbot, etc.) get OG-tagged HTML from your existing `og-meta` function.
- The Supabase URL is never visible to anyone.

## What I'll do (in Lovable)

1. **Create a new sibling repo** for the Vercel proxy (it's only 3 files, kept separate from this app's repo so it doesn't pollute the Lovable codebase). I'll provide the file contents and exact instructions to push it to a new GitHub repo named `partypanther-edge`:
   - `middleware.ts` — crawler detection + routing logic
   - `vercel.json` — config (matcher, framework=other)
   - `package.json` — minimal, no dependencies
2. **Revert `src/lib/slug-utils.ts`** so `getEventShareUrl` / `getPromoShareUrl` / `getVenueShareUrl` produce pretty `https://partypanther.net/e/...` URLs again.
3. **Leave the `og-meta` edge function as-is** — it already returns correct OG HTML and a redirect for humans; the Vercel middleware will only call it for crawlers, so the redirect path stays unused but harmless.

## What you'll do (one-time setup, ~30 min)

I'll guide you through each step in chat as we go, but for awareness:

1. Create a free Vercel account (sign in with GitHub).
2. Create a new empty GitHub repo `partypanther-edge`. I'll give you the 3 file contents to paste/commit.
3. In Vercel: **Add New Project** → import `partypanther-edge` → deploy (takes ~30 sec).
4. In Vercel project → **Settings → Domains** → add `partypanther.net` and `www.partypanther.net`. Vercel shows you the DNS records.
5. In Lovable: **Project Settings → Domains** → remove `partypanther.net` (keep the project published at `partypanther.lovable.app`).
6. At your registrar: replace existing A/CNAME records for `partypanther.net` and `www` with the values Vercel gives you (typically an A record `76.76.21.21` for root and a CNAME for www).
7. Wait for DNS to propagate (10 min – few hours). Vercel auto-issues SSL.
8. I run a `curl` test battery with crawler user-agents to confirm OG tags are correct on `/e/`, `/p/`, `/v/` URLs and that real browsers still see the app.

## Technical details (the middleware)

The Vercel middleware (~40 lines) does exactly this:

```ts
// Pseudocode — actual file will be provided
const CRAWLER_RE = /facebookexternalhit|Twitterbot|WhatsApp|LinkedInBot|.../i;
const TYPE_MAP = { e: "event", p: "promo", v: "venue" };

export default async function middleware(req) {
  const url = new URL(req.url);
  const ua = req.headers.get("user-agent") || "";
  const [, prefix, slug] = url.pathname.match(/^\/([^/]+)\/([^/?#]+)/) || [];

  if (CRAWLER_RE.test(ua) && TYPE_MAP[prefix] && slug) {
    return fetch(`https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/og-meta?type=${prefix}&slug=${slug}`);
  }

  // Everyone else → proxy to Lovable origin, preserving path/query
  return fetch(`https://partypanther.lovable.app${url.pathname}${url.search}`, {
    headers: { ...req.headers, host: "partypanther.lovable.app" }
  });
}
```

`vercel.json` sets the matcher to `/(.*)` so middleware runs on every path.

## What stays the same

- All app code, edits, and deploys happen in Lovable as today.
- Supabase database, edge functions, auth — unchanged.
- Lovable's "Publish" button still works; it updates `partypanther.lovable.app`, which Vercel proxies.
- The `partypanther-edge` repo essentially never needs to be touched again after setup.

## What changes

- DNS for `partypanther.net` moves from Lovable → Vercel.
- One extra service in your stack (Vercel free tier — well within limits for this use).
- If Vercel has an outage, the custom domain is down (but `partypanther.lovable.app` keeps working as a fallback).

## Order of operations once approved

1. I revert `slug-utils.ts` to pretty URLs (safe to do now — won't break anything because Lovable still serves the domain until you flip DNS).
2. I give you the 3 files for the `partypanther-edge` repo and walk you through creating it + deploying to Vercel.
3. You add the domain in Vercel and get the DNS records.
4. You remove the domain in Lovable + update DNS at your registrar.
5. I verify with curl and we're done.

No code in the main Lovable project changes beyond the `slug-utils.ts` revert.
