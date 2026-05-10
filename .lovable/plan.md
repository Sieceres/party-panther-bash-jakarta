
# HTML Reel → Video Tool

A new admin tool that lets you upload an animated HTML file (like `party_panther_story_7.html`), save it to a personal library, and export it as an MP4/WebM/GIF at 1080×1920.

## What you get

- New page at `/admin/html-reel-to-video` (entry button added to the IG Generator header so it's discoverable).
- Upload `.html` file → it's saved to Supabase Storage and listed in your library.
- Preview the HTML inside a 1080×1920 iframe (scaled down to fit the screen).
- Controls: **Duration** (1–30s slider) and **FPS** (15 / 24 / 30).
- **Export** dropdown: MP4 (WhatsApp / Instagram), WebM, GIF — same three options and same encoder code as the IG generator export.
- Library panel: list of saved reels with thumbnail (first frame), rename, delete, re-export.

## How recording works

```text
[ iframe loads HTML ]
        │
        ▼
[ requestAnimationFrame loop ]
   for N = duration * fps frames:
     - html2canvas(iframe.documentElement) → 1080×1920 canvas
     - push to frames[]
        │
        ▼
[ encode frames[] ]
   ├─ MP4   → encodeMp4WithWebCodecs (existing helper, reused)
   ├─ WebM  → MediaRecorder fallback (existing path)
   └─ GIF   → gif.js worker (existing path, 600px cap)
        │
        ▼
[ download Blob + upload thumbnail to library row ]
```

The CSS animations in the uploaded HTML run in real time inside the iframe; the capture loop simply samples frames at the chosen FPS for the chosen duration. Nothing in the IG generator's existing scene/animation code is touched.

## Storage & data

Two new pieces of backend (one migration):

- **Storage**: reuse existing `Party Panther Bucket I` bucket under prefix `html-reels/{user_id}/{uuid}.html` (and `.../thumb.jpg`). Public read, authenticated write to own folder.
- **Table**: `public.html_reels`
  - `name` (text), `html_url` (text), `thumbnail_url` (text, nullable), `default_duration` (int), `default_fps` (int)
  - RLS: admin-only read/write (matches existing IG generator access rule per memory).

## Files added/changed

**New**
- `src/pages/HtmlReelToVideo.tsx` — page shell, library + editor layout
- `src/components/html-reel/HtmlReelLibrary.tsx` — list/rename/delete saved reels
- `src/components/html-reel/HtmlReelPreview.tsx` — scaled iframe preview
- `src/components/html-reel/HtmlReelExporter.tsx` — duration/fps/format controls + capture loop
- `src/lib/html-reel-encoder.ts` — extracted encoder helpers (MP4/WebM/GIF) shared with `AnimationPreview.tsx`

**Changed**
- `src/App.tsx` — add `/admin/html-reel-to-video` route (above catch-all)
- `src/pages/InstagramPostGenerator.tsx` — add "HTML → Video" header button linking to the new page
- `src/components/instagram/AnimationPreview.tsx` — refactor to import shared encoder helpers (no behavior change)

**Migration**
- `html_reels` table + RLS policies + storage policies for the `html-reels/` prefix

## Known limits (worth flagging)

- **html2canvas can't render every CSS feature.** Complex blend-modes, `backdrop-filter`, some SVG filters, and `<canvas>`/WebGL inside the iframe may render imperfectly. Your uploaded file uses gradients, transforms, opacity and keyframes — those all work.
- **External fonts** (e.g. Google Fonts loaded by the HTML) need to finish loading before capture starts; the tool waits on `document.fonts.ready` inside the iframe before the first frame.
- **Performance**: 30fps × 6s × 1080×1920 ≈ 180 frames at full resolution. Capture takes ~30–60s on a typical laptop. UI shows a progress bar. (If this is too slow we can later swap html2canvas for a server-side Puppeteer edge function — out of scope for v1.)
- Recording is real-time playback; one-shot CSS animations longer than the chosen duration get cut off, animations shorter loop naturally.

## Out of scope (v1)

- Server-side rendering / headless Chrome
- Editing the HTML inside the app
- Audio tracks
- Multi-page or interactive HTML (clicks, scroll-driven anims)
