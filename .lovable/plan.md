

## Plan: SEO Optimization for Jakarta Nightlife Keywords

### The Problem

Your site is a single-page React app (SPA). Google can render SPAs but struggles with them because:
- There's only one `index.html` with generic meta tags
- No sitemap, no structured data, no keyword-rich content in the HTML
- Page titles update via JS but crawlers may not see them
- No per-page meta descriptions for `/events`, `/promos`, `/venues/*`, `/promos/*`

### What We'll Do

**1. Keyword-rich meta tags in `index.html`**
- Update `<title>` to: `Party Panther Jakarta — Drink Promos, Free Flow Deals & Nightlife Events`
- Update `<meta name="description">` to include target phrases: "Jakarta party", "Jakarta free flow", "Jakarta drink promo", "happy hour Jakarta", "ladies night Jakarta"
- Add `<meta name="keywords">` with those phrases
- Update OG tags to match

**2. Per-page dynamic meta tags with `react-helmet-async`**
- Install `react-helmet-async`
- Add `<HelmetProvider>` wrapper in `App.tsx`
- Add `<Helmet>` to key pages with unique titles and descriptions:
  - **Home**: "Party Panther Jakarta — Best Drink Promos & Nightlife Events"
  - **Events** (`/events`): "Jakarta Nightlife Events — Parties, Club Nights & Live Music"
  - **Promos** (`/promos`): "Jakarta Drink Promos — Free Flow, Happy Hour & Ladies Night Deals"
  - **Promo detail** (`/promos/:slug`): dynamic title with promo name + venue
  - **Event detail** (`/events/:slug`): dynamic title with event name + venue
  - **Venue detail** (`/venues/:slug`): dynamic title with venue name + area
  - **Map** (`/map`): "Jakarta Nightlife Map — Find Bars & Clubs Near You"
  - **Venue Directory** (`/venues`): "Jakarta Bars & Clubs Directory"

**3. Sitemap + robots.txt update**
- Create `public/sitemap.xml` with static routes (`/`, `/events`, `/promos`, `/venues`, `/map`, `/about`, `/contact`)
- Add `Sitemap: https://party-panther-bash-jakarta.lovable.app/sitemap.xml` to `robots.txt`

**4. Semantic HTML & structured data**
- Add JSON-LD structured data (`Organization` schema) to `index.html`
- Add an SEO-friendly `<h1>` in the Hero component that includes target keywords (can be visually styled however you want)

### Files to Change

| File | Change |
|------|--------|
| `index.html` | Meta tags, JSON-LD script |
| `src/App.tsx` | Add `HelmetProvider` |
| `src/pages/Index.tsx` | Add `<Helmet>` per section |
| `src/components/PromoDetailPage.tsx` | Dynamic `<Helmet>` |
| `src/components/EventDetailPage.tsx` | Dynamic `<Helmet>` |
| `src/components/VenueDetailPage.tsx` | Dynamic `<Helmet>` |
| `src/pages/MapExplorer.tsx` | `<Helmet>` |
| `src/pages/VenueDirectory.tsx` | `<Helmet>` |
| `public/sitemap.xml` | New static sitemap |
| `public/robots.txt` | Add sitemap reference |
| `src/components/Hero.tsx` | Keyword-rich `<h1>` |

### Limitations

Since this is a client-side SPA without server-side rendering, Google will need to execute JS to see per-page meta tags. The `react-helmet-async` approach works for social sharing previews (Twitter/Facebook use headless browsers) and improves Google's ability to index pages. For maximum SEO, you'd eventually want SSR (Next.js) or a prerendering service, but this plan gets you 80% of the benefit with no architecture change.

