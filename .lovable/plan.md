

## Plan: Auto-populate Venue Addresses via Geocoding

Most venues currently have no address or coordinates. We'll add an admin tool that geocodes each venue using the existing Photon proxy edge function (free, no API key needed).

### How it works

1. **Admin "Geocode Venues" button** in the Data Management tab of AdminDashboard
2. For each venue missing address/lat/lng, query Photon with `"{venue_name} Jakarta"` 
3. Take the top result and update the venue's `address`, `latitude`, and `longitude`
4. Show a progress indicator and report how many venues were updated vs skipped

### Changes

- **`src/components/AdminDashboard.tsx`**: Add a "Geocode Venues" button next to the existing "Seed Venues" and "Backfill Promos" buttons. The handler:
  - Fetches all venues where address is null/empty
  - For each, calls `searchPlaces(name + " Jakarta")` from `src/lib/photon.ts`
  - Updates the venue record with the first result's address, lat, lng
  - Adds a small delay between requests to be respectful to the Photon API
  - Shows toast with results count

This is a best-effort enrichment -- some venue names may not resolve correctly, but it will fill in the majority. Admins can manually correct any mismatches on the venue detail page.

