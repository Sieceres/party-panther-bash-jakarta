

## Plan: Venue Autocomplete with Auto-Creation and Internet Enrichment

### What the user will experience

1. **Typing a venue name** in the promo creation form shows a dropdown of matching venues from the database
2. **Selecting an existing venue** auto-fills address, area, and links the promo to that venue
3. **No match found** -- the input shows a subtle note: "This venue isn't in our directory yet -- it will be created automatically"
4. When the promo is submitted with an unmatched venue name:
   - A new venue record is auto-created in the `venues` table
   - The existing `scrape-venue-images` edge function is called (fire-and-forget) to enrich the new venue with Instagram, WhatsApp, Google Maps link, opening hours, and an image from the internet via Firecrawl

### Files to change

**1. New component: `src/components/form-components/VenueAutocomplete.tsx`**
- Replaces the plain text input in `PromoDiscount`
- Debounced search against `venues` table using `.ilike('name', '%query%')` as user types
- Shows dropdown of matching venues (name + address preview)
- When a venue is selected: calls `onVenueSelect` with venue id, name, address
- When no match: shows informational text, keeps free-text value
- Tracks whether an existing venue was selected (`selectedVenueId`) or it's a new name

**2. Update `src/components/form-components/PromoDiscount.tsx`**
- Replace the venue `<Input>` with the new `VenueAutocomplete` component
- Add `onVenueSelect` callback that also passes venue ID and auto-fills address

**3. Update `src/components/CreatePromoForm.tsx`**
- Track `venueId` in state (null if new venue)
- On submit, if `venueId` is null:
  - Insert a new venue into `venues` table with the typed name + address + `created_by`
  - Fire-and-forget call to `scrape-venue-images` edge function with the new venue's ID to enrich it from the web
- Set `venue_id` on the promo record if linking to an existing venue

**4. Update `src/pages/EditPromoPage.tsx`** (if applicable)
- Same autocomplete behavior for editing promos

### Technical details

- **Venue search query**: `supabase.from('venues').select('id, name, address, area').ilike('name', '%query%').limit(8)`
- **Debounce**: 300ms to avoid excessive queries
- **Enrichment**: Reuses the existing `scrape-venue-images` edge function with `mode: 'all'` and `venue_id` parameter -- no new edge function needed
- **No migration needed**: The `venues` table already has all required columns; promos already have `venue_id` as an optional foreign key

