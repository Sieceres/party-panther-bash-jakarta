export interface AreaRegion {
  key: string;
  label: string;
  lat: number;
  lng: number;
  neighborhoods: string[];
}

export const JAKARTA_AREAS: AreaRegion[] = [
  {
    key: "south",
    label: "South Jakarta",
    lat: -6.261,
    lng: 106.810,
    neighborhoods: ["Kemang", "Senopati & Gunawarman", "SCBD", "Senayan", "Blok M & Melawai"],
  },
  {
    key: "central",
    label: "Central Jakarta",
    lat: -6.186,
    lng: 106.834,
    neighborhoods: ["Sudirman & Thamrin", "Kuningan & Setiabudi", "Mega Kuningan", "Menteng & Cikini", "Kota Tua"],
  },
  {
    key: "north",
    label: "North Jakarta",
    lat: -6.121,
    lng: 106.830,
    neighborhoods: ["PIK", "Kelapa Gading", "Ancol"],
  },
  {
    key: "west",
    label: "West Jakarta",
    lat: -6.168,
    lng: 106.765,
    neighborhoods: ["Grogol", "Kebon Jeruk"],
  },
  {
    key: "east",
    label: "East Jakarta",
    lat: -6.225,
    lng: 106.900,
    neighborhoods: ["Kelapa Gading Timur"],
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
