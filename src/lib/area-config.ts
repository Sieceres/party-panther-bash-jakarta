export interface AreaRegion {
  key: string;
  label: string;
  lat: number;
  lng: number;
  neighborhoods: string[];
}

/** Approximate center coordinates for neighborhoods (for map fallback) */
export const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  "Kemang": { lat: -6.260, lng: 106.813 },
  "Senopati & Gunawarman": { lat: -6.237, lng: 106.800 },
  "SCBD": { lat: -6.225, lng: 106.805 },
  "Senayan": { lat: -6.228, lng: 106.789 },
  "Blok M & Melawai": { lat: -6.244, lng: 106.798 },
  "Sudirman & Thamrin": { lat: -6.200, lng: 106.822 },
  "Kuningan & Setiabudi": { lat: -6.220, lng: 106.830 },
  "Mega Kuningan": { lat: -6.230, lng: 106.835 },
  "Menteng & Cikini": { lat: -6.190, lng: 106.840 },
  "Kota Tua": { lat: -6.135, lng: 106.813 },
  "PIK": { lat: -6.105, lng: 106.740 },
  "Kelapa Gading": { lat: -6.155, lng: 106.905 },
  "Ancol": { lat: -6.127, lng: 106.840 },
  "Grogol": { lat: -6.163, lng: 106.785 },
  "Kebon Jeruk": { lat: -6.190, lng: 106.770 },
  "Kelapa Gading Timur": { lat: -6.160, lng: 106.915 },
};

export const JAKARTA_AREAS: AreaRegion[] = [
  {
    key: "south",
    label: "South Jakarta",
    lat: -6.261,
    lng: 106.810,
    neighborhoods: ["Kemang", "Senopati & Gunawarman", "SCBD", "Senayan", "Blok M & Melawai", "Kuningan & Setiabudi", "Mega Kuningan"],
  },
  {
    key: "central",
    label: "Central Jakarta",
    lat: -6.186,
    lng: 106.834,
    neighborhoods: ["Sudirman & Thamrin", "Menteng & Cikini", "Kota Tua"],
  },
  {
    key: "north",
    label: "North Jakarta",
    lat: -6.121,
    lng: 106.830,
    neighborhoods: ["PIK", "Kelapa Gading", "Kelapa Gading Timur", "Ancol"],
  },
  {
    key: "west",
    label: "West Jakarta",
    lat: -6.168,
    lng: 106.765,
    neighborhoods: ["Grogol", "Kebon Jeruk"],
  },
];

/** Get all neighborhoods as a flat list */
export function getAllNeighborhoods(): string[] {
  return JAKARTA_AREAS.flatMap((r) => r.neighborhoods);
}

/** Get the region key for a given neighborhood (case-insensitive) */
export function getRegionForArea(area: string): string | null {
  const lower = area.toLowerCase();
  for (const region of JAKARTA_AREAS) {
    if (region.neighborhoods.some((n) => n.toLowerCase() === lower)) {
      return region.key;
    }
  }
  return null;
}

/** Get all neighborhoods for a given region key */
export function getNeighborhoodsForRegion(regionKey: string): string[] {
  return JAKARTA_AREAS.find((r) => r.key === regionKey)?.neighborhoods ?? [];
}

/** Normalize an area string to canonical casing from the config */
export function normalizeArea(area: string): string {
  const lower = area.toLowerCase();
  for (const region of JAKARTA_AREAS) {
    const match = region.neighborhoods.find((n) => n.toLowerCase() === lower);
    if (match) return match;
  }
  return area; // return as-is if not found
}

/** Check if an area value matches any of the selected filter values.
 *  Filter values can be region keys (e.g. "south") or neighborhood names. */
export function areaMatchesFilter(promoArea: string | null, filterValues: string[]): boolean {
  if (!promoArea) return false;
  const lower = promoArea.toLowerCase();

  for (const filterVal of filterValues) {
    // Check if filter is a region key
    const region = JAKARTA_AREAS.find((r) => r.key === filterVal);
    if (region) {
      if (region.neighborhoods.some((n) => n.toLowerCase() === lower)) return true;
    }
    // Check direct neighborhood match
    if (filterVal.toLowerCase() === lower) return true;
  }
  return false;
}
