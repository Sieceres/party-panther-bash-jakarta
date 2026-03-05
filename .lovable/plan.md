

## Fix: Area System with Subareas

### Problem
The current area filter uses broad regions (`north`, `south`, `east`, `west`, `central`) but actual promo data contains specific neighborhoods like "Kemang", "SCBD", "Senopati & Gunawarman", "Mega Kuningan", etc. The filter never matches because the values don't align.

### Solution: Neighborhood-based areas grouped by region

Replace the flat area system with a two-level structure: neighborhoods grouped under Jakarta regions. The area field stores the specific neighborhood name (e.g., "SCBD"), and filtering by a region (e.g., "South Jakarta") matches all neighborhoods within it.

**Area mapping:**

```text
South Jakarta:  Kemang, Senopati & Gunawarman, SCBD, Senayan, Blok M & Melawai
Central Jakarta: Sudirman & Thamrin, Kuningan & Setiabudi, Mega Kuningan, Menteng & Cikini, Kota Tua
North Jakarta:  PIK, Kelapa Gading, Ancol
West Jakarta:   Grogol, Kebon Jeruk
East Jakarta:   Kelapa Gading Timur
```

### Changes

1. **New file `src/lib/area-config.ts`** -- Define the area hierarchy as a constant: `JAKARTA_AREAS` mapping region keys to arrays of neighborhood names. Export helper functions: `getRegionForArea(area)`, `getNeighborhoodsForRegion(region)`, `getAllNeighborhoods()`.

2. **`src/components/sections/PromosSection.tsx`** -- Replace the flat `areaOptions` with the grouped structure. The filter dropdown shows regions as group headers with neighborhoods underneath. When a region is selected, all its neighborhoods match. Also update filter logic to compare against actual neighborhood values in promo data.

3. **`src/components/form-components/PromoDetails.tsx`** -- Replace the 5 broad area options with the full neighborhood list grouped by region, so new promos get specific areas.

4. **`src/components/BatchImportReview.tsx`** -- Update the area input to use the same neighborhood Select instead of a free-text input.

5. **`supabase/functions/extract-from-image/index.ts`** -- Update the AI extraction prompt to output specific neighborhood names instead of broad regions.

6. **Data fix** -- Normalize existing area values (e.g., uppercase "SCBD" vs "Scbd") to consistent casing using an UPDATE query.

