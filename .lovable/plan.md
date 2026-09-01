# Compact List View for Promos + Scroll-to-Top

## 1. Compact list view with sortable columns

Add a **view toggle** (Cards / List) on the Promos page, next to the existing Sort By control. Default stays the current card grid; choice persists in `sessionStorage` alongside the other promo filters.

**Desktop (list view):** a table-like list with clickable column headers that sort ascending/descending (arrow indicator on active column):

- **Name** — promo title (with venue name as secondary line)
- **Promo Type** — e.g. Happy Hour, Ladies Night
- **Day** — sorted in weekday order (Mon → Sun), multi-day promos sort by their earliest day
- **Area** — mapped to the 5 Jakartas (Jakarta Barat/Timur/Pusat/Selatan/Utara) via the existing `areaMatchesFilter`/area-config mapping, so sorting groups by region
- **Price** — discounted price (replaces "Time", see note below)

**Note on "Time":** promos have no time field in the database — only day of week. There is nothing to sort by. Options: (a) skip the Time column (planned), or (b) we add a start/end time field to promos later and add the column then.

Clicking a row navigates to the promo detail page (same as clicking a card today).

## 2. Mobile behavior

A 5-column table doesn't fit on a phone. On screens under 768px the list view switches to **compact rows** instead of a table: each row shows title, venue, promo-type badge, day chips and area on one/two lines. Sorting is still available via a small "Sort by" dropdown above the list (same column options). The view toggle stays available on mobile since compact rows are still denser than cards.

## 3. Scroll to top

- **Subsection switch:** already scrolls via `handleSectionChange` — will verify it also fires for the profile section, which currently doesn't navigate.
- **On reload:** browsers restore the previous scroll position. Set `history.scrollRestoration = 'manual'` and force `window.scrollTo(0, 0)` on app mount (`App.tsx`), so a reload always lands at the top.
- Keep the existing `ScrollToTop` route-change behavior, switched to instant (`behavior: 'auto'`) on initial load only, smooth after.

## 4. Cooler promo cards

The current cards (especially ones using the category placeholder images) look flat. Restyle `PromoCard` with a neon treatment that fits the existing cyan identity:

- **Backdrop**: keep the drink image but deepen it — dark gradient overlay from the bottom, subtle cyan radial glow that intensifies on hover; card border brightens and gains a soft cyan glow shadow on hover.
- **Badges/buttons**: promo-type pill and heart button become frosted glass (blur + translucent border) instead of flat black/white circles.
- **Content block**: title over a dark gradient scrim, venue in small uppercase tracking, day chips, and the price as a bold cyan figure with the original price struck through.
- **Hover CTA**: keep the existing "View Promo Details" slide-up but give it the cyan gradient treatment.
- Applies everywhere `PromoCard` is used (home + promos page grid), so both stay consistent.

## Files

- `src/components/sections/PromosSection.tsx` — view toggle, list/table rendering, sortable headers, mobile compact rows
- `src/components/PromoCard.tsx` — card visual restyle
- `src/pages/Index.tsx` — list-sort state + URL/sessionStorage persistence (same pattern as existing filters)
- `src/lib/area-config.ts` — reuse for area grouping
- `src/App.tsx` — scrollRestoration manual + scroll to top on mount
- `src/lib/version.ts` — version bump
