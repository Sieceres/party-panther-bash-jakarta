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

## 4. Better placeholder drink images

The text and layout of the cards stay as they are. The problem is the placeholder artwork: flat vector-style drinks on solid gradient backgrounds. Replace all 7 with photographic, realistic images that actually look like the drink the promo is about:

- `wine.jpg` — glass(es) of red/white wine on a dark bar counter
- `beer.jpg` — cold draft beer, condensation on the glass
- `cocktail.jpg` — a real garnished cocktail under moody bar lighting
- `spirits.jpg` — whisky/spirit pour over ice, bottles behind
- `coffee.jpg` — espresso/latte on a cafe surface
- `food.jpg` — bar-food plate, appetizing and warmly lit
- `drink.jpg` — generic bar scene fallback, mixed drinks on a counter

Shared look so the grid stays coherent: dark, moody, low-key nightlife lighting with a cyan/magenta rim-light hint to match the Party Panther palette, shallow depth of field, 16:9 crop, no text, no people's faces, subject centered-ish so the card crop doesn't cut it.

The existing dark gradient scrim and badges on the card keep the title legible over the photos; the scrim strength gets a small bump if any image reads too bright behind the text.

## Files

- `public/placeholders/*.jpg` — regenerate the 7 placeholder images (same filenames, so no mapping change needed)
- `src/lib/drink-categories.ts` — unchanged unless a path needs adjusting
- `src/components/PromoCard.tsx` — minor scrim/contrast tweak only if needed for legibility
- `src/components/sections/PromosSection.tsx` — view toggle, list/table rendering, sortable headers, mobile compact rows
- `src/pages/Index.tsx` — list-sort state + URL/sessionStorage persistence (same pattern as existing filters)
- `src/lib/area-config.ts` — reuse for area grouping
- `src/App.tsx` — scrollRestoration manual + scroll to top on mount
- `src/lib/version.ts` — version bump
