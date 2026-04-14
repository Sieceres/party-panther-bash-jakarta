

## Plan: Improve Venue Registration Dialog

### Changes to the Form UI
1. **Remove** Address and Opening Hours fields from the dialog
2. **Add** Instagram field (e.g., `@handle`)
3. **Update validation**: require either WhatsApp OR Instagram (not both mandatory)
4. **Add** `venue_instagram` column to `profiles` table via migration

### Linking to Venue Directory - Recommended Flow

When a venue application is approved by an admin, the system should:

1. **Check if venue already exists** in the `venues` table (fuzzy match on `business_name`)
2. **If found**: automatically link via `venue_claims` (set `claimed_by` on the matching venue)
3. **If not found**: create a new entry in `venues` with the business name, WhatsApp, and Instagram from the profile, then set `claimed_by` to the user. Trigger `scrape-venue-images` to enrich the venue with photo, address, coordinates, opening hours, and Google Maps link.

This keeps the registration form simple (just name + contact) while the scraper handles enrichment automatically.

### Technical Steps

1. **Migration**: Add `venue_instagram` column to `profiles` table
2. **UserProfile.tsx**:
   - Add `venue_instagram` to `editForm` state and `handleSaveProfile`
   - Remove address/opening hours fields from dialog
   - Add Instagram field
   - Update validation: `business_name && (venue_whatsapp || venue_instagram)`
3. **Admin approval flow** (existing or new): When admin approves a venue application, auto-create/link a `venues` entry and trigger scraper enrichment

### Files Modified
- `src/components/UserProfile.tsx` - form UI changes
- New migration for `venue_instagram` column
- Admin approval handler update (to auto-create venue entry)

