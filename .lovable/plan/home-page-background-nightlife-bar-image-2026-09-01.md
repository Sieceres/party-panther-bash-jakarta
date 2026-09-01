# Home page background: nightlife bar image

Give the home section the same atmosphere as `og-default-v2.jpg` — the moody blurred bar with cyan/purple lighting — instead of the flat dark background.

## What changes

- The home view gets the bar photo as a fixed, full-bleed background behind all content.
- A dark gradient overlay sits on top so headings, cards and buttons stay fully readable (roughly 75–85% darkening, heavier at the bottom).
- The background stays put while scrolling on desktop; on mobile it uses a normal cover background (fixed attachment is unreliable on iOS).
- Only the home section is affected. Events, Promos and other sections keep the current background.
- Existing cards keep their look but get a slight translucent/blur treatment so the photo shows through subtly rather than being hidden.

## Technical notes

- Reuse `public/og-default-v2.jpg` directly (no new asset). The logo/text baked into that image is not an issue since the photo is heavily darkened and cropped by `cover`.
- Add a `--gradient-hero-overlay` style token in `index.css` rather than hardcoding colors, per the design-system rule.
- Implement in `src/pages/Index.tsx`: wrap the section render in a container that applies the background layer only when `activeSection === "home"`.
- Bump `src/lib/version.ts` to 0.90.
