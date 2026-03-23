

## Plan: Area Filter Improvements, Kuningan Merge, Venue Area Review Page

### Summary of changes

1. **Merge "Mega Kuningan" into "Kuningan & Setiabudi"** in area-config.ts
2. **Add hover highlights** to area filter items
3. **Add "Clear Filters" button** to PromosSection (visible when filters are active, above the filter row)
4. **Add `area` column to venues table** via migration
5. **Show area on VenueDetailPage** as a badge near the venue name
6. **Add area field to VenueEditDialog** using AreaFilterList in single-select mode
7. **Create Venue Area Review page** at `/admin/review-venues` mirroring PromoReview layout
8. **Add links** to both review tools from AdminDashboard

---

### 1. `src/lib/area-config.ts`
- Merge "Mega Kuningan" into "Kuningan & Setiabudi" -- keep the name as "Kuningan & Setiabudi"
- Remove "Mega Kuningan" from South Jakarta neighborhoods array
- Remove "Mega Kuningan" coords entry; keep "Kuningan & Setiabudi" coords
- Update `normalizeArea` to map "Mega Kuningan" to "Kuningan & Setiabudi"

### 2. `src/components/ui/area-filter.tsx`
- Add `hover:bg-accent/60 rounded px-1 py-0.5 transition-colors` to region row div and neighborhood row div

### 3. `src/components/sections/PromosSection.tsx`
- Add a "Clear Filters" button with RotateCcw icon next to the search bar or filter row, visible only when `hasActiveFilters || searchQuery`
- The `resetAllFilters` function already exists; extend it to also call `onSearchChange("")`

### 4. Database migration
```sql
ALTER TABLE venues ADD COLUMN IF NOT EXISTS area text;
```

### 5. `src/components/VenueDetailPage.tsx`
- Add `area` to the Venue interface (already fetches `*` so column will be included)
- Display area as a Badge below the venue name using `getRegionForArea()` to show "Kemang · South Jakarta" style
- Import `getRegionForArea`, `JAKARTA_AREAS` from area-config

### 6. `src/components/VenueEditDialog.tsx`
- Add `area` to the Venue interface
- Replace the simple EDITABLE_FIELDS text approach for area with an AreaFilterList in single-select mode
- The area field renders as a special case in the form: a collapsible area picker instead of a text input

### 7. New file: `src/pages/VenueAreaReview.tsx`
Split-pane layout matching PromoReview.tsx:
- **Left pane**: Scrollable venue list (name + current area badge or "—")
- **Right pane**: Venue detail (name, address with Google Maps link, instagram, website, current area)
- **Keyboard shortcuts**:
  - `Q` prev, `A` next, `Ctrl+Z` undo
  - Region keys: `1` South, `2` Central, `3` North, `4` West -- enters sub-mode showing neighborhood numbers
  - Direct neighborhood keys: `K` Kemang, `S` Senopati & Gunawarman, `C` SCBD, `M` Menteng & Cikini, `P` PIK, `G` Kelapa Gading, `B` Blok M & Melawai, `T` Sudirman & Thamrin
- **Filter toggle**: Show only unassigned venues (area IS NULL)
- **Undo stack**: Same pattern as PromoReview
- On assignment: update venue's `area` column, auto-advance to next

### 8. `src/App.tsx`
- Add route: `<Route path="/admin/review-venues" element={<VenueAreaReview />} />`

### 9. `src/components/AdminDashboard.tsx`
- Add two link buttons (not tabs) near the top of the dashboard or in a "Tools" section:
  - "Review Promo Categories" linking to `/admin/review-promos`
  - "Review Venue Areas" linking to `/admin/review-venues`
- Place these as `Button variant="outline"` with `onClick={() => navigate(...)}` in the promos TabsContent and venues TabsContent respectively

### Technical notes
- The venues table currently has no `area` column -- migration adds it
- VenueDetailPage fetches with `select("*")` via `getVenueBySlugOrId`, so the new column will be automatically available
- The AreaFilterList component already supports `singleSelect` mode
- Legacy "Mega Kuningan" values in existing promo data will be handled by `normalizeArea` and `areaMatchesFilter`

