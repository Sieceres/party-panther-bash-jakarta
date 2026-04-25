## The problem

Right now when Facebook, WhatsApp, Twitter, LinkedIn, etc. fetch a share URL like `https://partypanther.net/e/some-event-slug`, Cloudflare returns the generic Lovable `index.html` with hard-coded "Party Panther Jakarta" OG tags. The crawler never sees the event-specific title, image, or description.

I verified this directly:
- `curl -A "facebookexternalhit/1.1" https://partypanther.net/e/test-event` → returns the generic `index.html`
- The `og-meta` Supabase Edge Function itself works correctly and returns event-specific OG tags when called

So the edge function is fine. **The missing piece is the Cloudflare Worker (`ppworker`) intercepting crawler requests.**

When we removed the Worker Custom Domain attachment to fix the site outage, the Worker stopped seeing any traffic. To restore rich previews we need to re-attach it — but as **Routes**, not as a Custom Domain (which would break the site again).

## Required Cloudflare changes (you do these in the dashboard)

### 1. Add Worker Routes

Go to **Workers & Pages → `ppworker` → Settings → Triggers → Routes** and add:

| Route pattern | Zone |
|---|---|
| `partypanther.net/e/*` | partypanther.net |
| `partypanther.net/p/*` | partypanther.net |
| `partypanther.net/v/*` | partypanther.net |
| `www.partypanther.net/e/*` | partypanther.net |
| `www.partypanther.net/p/*` | partypanther.net |
| `www.partypanther.net/v/*` | partypanther.net |

**Critical:** Do NOT add a catch-all like `partypanther.net/*` — that would break the site again. Only the three short-share prefixes.

### 2. Confirm there's no Custom Domain on the Worker

Same Triggers page — the **Custom Domains** section must be empty (no `partypanther.net` or `www.partypanther.net` listed). If they reappeared, remove them.

### 3. Verify DNS is unchanged

A `@` and A `www` should still point to `185.158.133.1` (proxied 🟠). Routes attach to the proxied request flow, so this stays as-is.

## What the Worker should do (for reference — already deployed)

The Worker code (`ppworker`, lives in Cloudflare, not in this repo) should:

1. Inspect the `User-Agent` header on incoming requests
2. If it matches a known social crawler (`facebookexternalhit`, `Twitterbot`, `LinkedInBot`, `WhatsApp`, `Slackbot`, `TelegramBot`, `Discordbot`, `Googlebot`, etc.) → fetch and return the response from `https://qgttbaibhmzbmknjlghj.supabase.co/functions/v1/og-meta/{e|p|v}/{slug}` (passing the `apikey` header)
3. Otherwise → `fetch(request)` to pass the user through to Lovable's origin

If the Worker code was lost or needs verification, I can paste the source for you to redeploy — just say the word.

## How I'll verify it works

Once you've added the routes, ping me and I'll run:

```bash
# Should return event-specific OG tags
curl -A "facebookexternalhit/1.1" https://partypanther.net/e/<real-event-slug>

# Should return the normal React app
curl -A "Mozilla/5.0" https://partypanther.net/e/<real-event-slug>
```

Then you can re-scrape in:
- Facebook: https://developers.facebook.com/tools/debug/
- Twitter/X: https://cards-dev.twitter.com/validator
- LinkedIn: https://www.linkedin.com/post-inspector/

## Code changes in this repo

**None required.** Everything on the app side is already in place:
- `getEventShareUrl` / `getPromoShareUrl` / `getVenueShareUrl` in `src/lib/slug-utils.ts` already build the `/e/*`, `/p/*`, `/v/*` short URLs
- The `og-meta` edge function in `supabase/functions/og-meta/index.ts` already returns event/promo/venue-specific meta tags

This is a pure Cloudflare configuration fix.

## TL;DR for Cloudflare

> "On Worker `ppworker`, add Routes for `partypanther.net/e/*`, `/p/*`, `/v/*` and the same three patterns on `www.partypanther.net`. Do NOT add a Custom Domain and do NOT add a catch-all `/*` route. DNS A records for `@` and `www` stay pointing to `185.158.133.1` proxied."
