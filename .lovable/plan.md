## What I found

1. **The Worker routes are NOT firing** despite being listed and enabled.
   - I requested `https://partypanther.net/e/angkot-pub-crawl` with `User-Agent: facebookexternalhit/1.1`
   - The response was the generic Lovable `index.html` (with `x-deployment-id` and `set-cookie: __dpl=...` — both signatures of Lovable's origin, not the Worker)
   - If the Worker were running, the response would have come from `og-meta` with event-specific tags

2. **The Worker code itself is correct.** I reviewed it — it inspects User-Agent, matches `/e/`, `/p/`, `/v/` prefixes, fetches from the og-meta function, and falls back to origin proxy. The og-meta function works fine without an apikey (verified — returns 200).

3. **Separate bug spotted in og-meta:** when an event's `image_url` is a `data:image/...` base64 string, the code prepends `partypanther.net/` to it, producing a broken URL like `https://partypanther.net/data:image/jpeg;base64,...`. This needs a one-line fix.

## Why aren't the routes firing?

You confirmed all 6 routes are listed, assigned to `ppworker`, and enabled. So one of these subtle Cloudflare gotchas must apply:

### Most likely culprit: route order / Custom Domain remnant
In Cloudflare, **Custom Domains beat Routes** in the matching priority. If `partypanther.net` (or `www.partypanther.net`) is still attached as a Custom Domain on **any** Worker (not necessarily `ppworker`), that Custom Domain hijacks ALL paths including `/e/*`, and Routes for those paths never get a chance to fire.

The Custom Domain might be:
- Still on `ppworker` (from an old config), OR
- On a **different** Worker in the same account, OR
- Shown in the zone-level Workers Routes view but not the per-Worker view

### Second possibility: Route pattern needs the protocol/wildcard
Cloudflare sometimes interprets `partypanther.net/e/*` differently from `*partypanther.net/e/*` or `https://partypanther.net/e/*`. The `*` prefix variant matches more reliably.

## Diagnostic steps for you to run

Please check **one** Cloudflare page:

**Cloudflare dashboard → partypanther.net zone → Workers Routes** (this is the zone-level view, NOT the per-Worker view)

Tell me:
1. How many entries appear there?
2. For each, what's the **Route pattern** (exact text) and what **Worker** is it assigned to?
3. Is there any entry with pattern `partypanther.net/*` or `*partypanther.net/*` (catch-all)?
4. Below the routes list, is there a "Custom Domains" or HTTP Routes section showing the apex domain attached to a Worker?

Also check:

**Cloudflare → Workers & Pages → (every Worker in your account) → Settings → Domains & Routes**
- Is `partypanther.net` or `www.partypanther.net` listed as a **Custom Domain** on ANY worker (including ones other than `ppworker`)?

## What I'll do once you confirm

Based on your answers:
- **If a stale Custom Domain exists** → you remove it, then I re-test.
- **If routes are wrong-zone or wrong-pattern** → I'll give you the exact patterns to recreate.
- **If everything looks right but it still doesn't fire** → I'll have you do a one-line edit to the Worker (add a `console.log` at the top) and check Worker logs to confirm whether it's even being invoked. If it isn't, that proves a routing issue at the Cloudflare layer.

## Code fix in this repo (independent of Cloudflare)

Fix the `data:` URL bug in `supabase/functions/og-meta/index.ts`:

```ts
function absoluteImage(image: string | null | undefined): string {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith("data:")) return DEFAULT_IMAGE; // base64 inline images can't be used as og:image
  if (/^https?:\/\//i.test(image)) return image;
  if (image.startsWith("/")) return `${SITE_URL}${image}`;
  return `${SITE_URL}/${image}`;
}
```

Reason: Facebook/WhatsApp/etc. cannot fetch `data:` URLs as preview images. Some of your events have base64-encoded images stored directly in `image_url`, so even when the Worker DOES fire, the preview image will be broken. Falling back to the default keeps previews working.

## TL;DR

The Worker isn't being invoked at all by Cloudflare — please check the zone-level Workers Routes page and verify no other Worker has `partypanther.net` as a Custom Domain. While you do that, I'll patch the `data:` URL bug in og-meta so previews don't break for events that use inline base64 images.
