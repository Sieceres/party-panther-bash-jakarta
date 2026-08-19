# Custom event URLs (with expiry) + switchable AI style

## 1. Custom event URLs

Organizers can claim a short custom link for their event, e.g. `partypanther.net/e/rooftop-nye`.

**Anti-squatting via expiry**
- A custom link is only reserved from the moment it is claimed until **30 days after the event date**.
- Once expired, the link is automatically released and can be claimed by anyone else. The event stays reachable forever through its normal auto-generated slug, so nothing breaks.
- Expired-but-not-reclaimed links keep working (grace), they simply stop blocking others.
- Recurring events keep their link refreshed automatically as the date moves forward.

**Rules**
- 3–40 chars, lowercase letters/numbers/hyphens only.
- Blocklist of reserved words (admin, auth, events, promos, venue, api, login, privacy, e, p, v, …).
- One custom link per event; only the event creator, co-organizers, or an admin can set it.
- Live availability check as you type (green "available" / red "taken until …").
- Changing it frees the old one immediately.

**Where it appears**
- New "Custom link" field in the event form (create + edit), under the title, showing the full preview URL and a copy button.
- Share buttons use the custom link when one is active.

## 2. Change AI style without re-uploading

In the poster auto-fill panel, after the first extraction the uploaded poster (or pasted text) is kept in memory. A **"Re-extract with this style"** button appears next to the style picker so switching between Playful / Compact / Exact / Custom re-runs the AI on the same source instantly. A small thumbnail of the retained poster is shown so it is clear what will be re-processed.

## Technical notes
- Migration: add `custom_slug text unique`, `custom_slug_expires_at timestamptz` to `public.events`; partial unique index on active claims; helper function `claim_event_custom_slug(event_id, slug)` (security definer) validating format, blocklist, permissions and expiry-based availability; grants unchanged (RLS on events already covers reads).
- Route resolution: `getEventBySlugOrId` gains a `custom_slug` lookup first, then slug, then id. `getEventUrl`/`getEventShareUrl` prefer `custom_slug` when non-expired.
- `EventAIExtract` keeps `lastSource` state (`{kind: 'image'|'text', value}`) and exposes a re-extract action reusing the existing `extract-from-image` edge function.
