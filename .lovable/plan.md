

## Plan: Replace Leaflet/Google Maps JS with Free iframe Embed + Truncate Address

### 1. Replace map with Google Maps iframe embed

In `VenueDetailPage.tsx`, replace the `<GoogleMap>` component usage (line 332) with a simple `<iframe>` embed:

```tsx
<iframe
  width="100%"
  height="300"
  style={{ border: 0 }}
  loading="lazy"
  referrerPolicy="no-referrer-when-downgrade"
  src={`https://www.google.com/maps?q=${encodeURIComponent(venue.address || venue.name)}&output=embed`}
/>
```

This uses the venue **address text** (not lat/lng), so the map pin will always match the clickable address link. Completely free, no API key needed.

- Remove the `GoogleMap` import (line 10) since it's no longer used here
- Change the map section condition from `markers.length > 0` to `venue.address` (show map whenever there's an address, regardless of lat/lng)
- Remove the `markers` const (line ~213) since it's no longer needed

### 2. Truncate address after district

Add a helper function to extract the short address (up to the district/neighborhood name):

```tsx
const truncateAddress = (address: string) => {
  // Jakarta addresses typically follow: Street, Building, District, City
  // Common Jakarta districts to match against
  const parts = address.split(",");
  // Show first 2-3 parts (street + district), skip city/postal/country
  if (parts.length <= 2) return address;
  // Take parts until we hit a known city name or postal code
  const cityPatterns = /jakarta|indonesia|dki|java|\d{5}/i;
  const truncated: string[] = [];
  for (const part of parts) {
    if (cityPatterns.test(part.trim())) break;
    truncated.push(part.trim());
  }
  return truncated.length > 0 ? truncated.join(", ") : parts.slice(0, 2).join(", ");
};
```

Apply `truncateAddress()` to address display in both the Location card and the Venue Info sidebar, with the full address kept in the link's `title` attribute for hover tooltip.

### Files to edit

- **`src/components/VenueDetailPage.tsx`** — All changes in this single file

