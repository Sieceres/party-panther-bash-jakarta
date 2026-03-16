

## Two Issues to Fix

### 1. Inaccurate Jakarta Subareas

Current geographic classification has several errors:

- **Kelapa Gading Timur** is listed under East Jakarta — it's actually **North Jakarta** (part of Kelapa Gading). Should be merged with the existing "Kelapa Gading" entry or listed alongside it under North.
- **Kuningan & Setiabudi** is under Central Jakarta — Setiabudi is administratively **South Jakarta**. However, for nightlife purposes this is a gray area. Kuningan straddles South/Central.
- **Mega Kuningan** is under Central Jakarta — also administratively **South Jakarta**.
- **Sudirman & Thamrin** under Central — Sudirman is mostly South Jakarta, Thamrin is Central. This is a common grouping but worth noting.
- **Kota Tua** under Central — it's technically West Jakarta, though often grouped with Central.

**Proposed correction:**
- Move **Kelapa Gading Timur** from East Jakarta to North Jakarta (merge with Kelapa Gading or keep separate)
- Move **Kuningan & Setiabudi** and **Mega Kuningan** from Central to South Jakarta
- Keep Sudirman & Thamrin and Kota Tua in Central (commonly associated despite administrative borders)
- East Jakarta becomes empty — either remove it or add proper East Jakarta neighborhoods (e.g., "Cawang", "Rawamangun")
- Update `NEIGHBORHOOD_COORDS` accordingly

**Files:** `src/lib/area-config.ts`

### 2. "Load More" Shows When Filters Reduce Results

The `hasMore` flag is based on raw pagination state (`allPromos.length > ITEMS_PER_PAGE`), but when filters/search are active, the displayed list may already show all matching results from the full dataset. The "Load More" button still appears because `hasMorePromos` doesn't account for filtering.

**Fix:** In `Index.tsx`, when any filter or search is active, the code already uses `allPromos` as the source (for search) or filters `promos` (paginated). The issue is:
- When search is active → `allPromos` is the source → all data is loaded → `hasMore` should be `false`
- When filters are active (no search) → `promos` (paginated) is the source → but filtered results may be fewer than a page → `hasMore` is misleading

**Solution:** Pass a computed `hasMore` to PromosSection that is `false` when:
1. A search query is active (already using full dataset), OR
2. Any filter is active and `filteredAndSortedPromos.length` equals the total filtered count from `allPromos`

Simplest approach: when any filter or search is active, also use `allPromos` as source and set `hasMore` to `false`.

**Files:** `src/pages/Index.tsx` (change `hasMore` prop logic)

