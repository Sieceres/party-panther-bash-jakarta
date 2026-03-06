

## Interactive Map Page for Promos & Events

### Concept
A dedicated `/map` page showing all promos and events as markers on an interactive map of Jakarta. Users can click markers to see details and navigate to the full promo/event page. The existing area filter system integrates naturally -- selecting a region zooms to that part of Jakarta.

### How it works
- Full-screen map (using the existing `GoogleMap` component or Leaflet since both are already installed) centered on Jakarta
- Markers for promos (one color) and events (another color)
- Clicking a marker shows a popup card with title, venue, and a "View Details" link
- Sidebar or top bar with toggles for promos vs events, plus area filter chips that zoom the map to the selected region
- Each region in `JAKARTA_AREAS` gets approximate center coordinates for zoom targeting

### Changes

1. **`src/lib/area-config.ts`** -- Add center coordinates (`lat`, `lng`) to each `AreaRegion` so selecting a region can pan/zoom the map (e.g., South Jakarta: -6.26, 106.80).

2. **New `src/pages/MapExplorer.tsx`** -- Main page component:
   - Fetches promos and events from Supabase (only those with lat/lng)
   - Renders a full-height Leaflet map (better for this use case -- no API key needed, already installed)
   - Color-coded markers: promos in one color, events in another
   - Marker popups with title, venue name, date/discount info, and link to detail page
   - Toggle buttons to show/hide promos vs events
   - Region filter chips that pan+zoom the map

3. **`src/App.tsx`** -- Add route `/map` pointing to MapExplorer.

4. **`src/components/Header.tsx`** -- Add a "Map" nav link to the header navigation.

### Technical notes
- Uses Leaflet (already installed: `leaflet`, `react-leaflet`) instead of Google Maps to avoid API key dependency for this public-facing page
- Markers use custom colored icons (CSS-based or Leaflet divIcon) to distinguish promos from events
- Mobile-friendly: map fills viewport below header, filter controls overlay on top

