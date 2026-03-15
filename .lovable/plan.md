

## Problem Analysis

"Buy 2 Get 3 Beers" is being classified as "Free Flow" when it's clearly a "Bucket Deal" (multi-buy discount). The root cause is in **two places**:

1. **AI extraction prompt** (edge function) — lists outdated snake_case promo types (`happy_hour, ladies_night, brunch_deal, food_special, drink_special, live_music, other`) that don't match the actual DB values, and critically **misses key types** like "Bucket Deal", "Bottle Promo", and "Happy Hour" (title case).

2. **No normalization layer** — whatever the AI returns is used as-is. Since "Bucket Deal" isn't an option, the AI picks the closest match (incorrectly "Free Flow" for multi-buy deals).

3. **Inconsistent promo type lists** — `BatchImportReview.tsx` has 4 types, `PromoDetails.tsx` has 4 types, `PromosSection.tsx` has 4 filter types. All are missing "Happy Hour", "Bucket Deal", "Brunch Deal", "Food Special", "Drink Special", and "Live Music" from the memory docs.

## Plan

### 1. Create a single source of truth for promo types

Add a `PROMO_TYPES` constant in a shared file (e.g., `src/lib/promo-types.ts`) with all valid types and clear descriptions for AI classification:

- Happy Hour
- Ladies Night  
- Free Flow
- Bottle Promo
- Bucket Deal
- Brunch Deal
- Food Special
- Drink Special
- Live Music
- Other

### 2. Update the AI extraction prompt

In `supabase/functions/extract-from-image/index.ts`, replace the `promo_type` description with the correct title-case values and add classification guidance:

```
"Type — MUST be one of: Happy Hour, Ladies Night, Free Flow, Bottle Promo, Bucket Deal, Brunch Deal, Food Special, Drink Special, Live Music, Other.
Use 'Free Flow' ONLY for unlimited/all-you-can-drink deals.
Use 'Bucket Deal' for buy-X-get-Y or multi-drink bundle deals.
Use 'Bottle Promo' for bottle service discounts."
```

### 3. Add a normalization function for AI output

In the batch import flow (likely `BatchImportReview.tsx` or `spreadsheet-parser.ts`), add a mapping that normalizes snake_case AI output to title-case DB values:

```
happy_hour → Happy Hour
ladies_night → Ladies Night
bucket_deal → Bucket Deal
free_flow → Free Flow
bottle_promo → Bottle Promo
```

This catches any legacy or inconsistent AI responses.

### 4. Update all promo type lists in UI components

Replace hardcoded arrays in these files with the shared constant:
- `src/components/BatchImportReview.tsx` (line 64)
- `src/components/form-components/PromoDetails.tsx` (lines 75-78)
- `src/components/sections/PromosSection.tsx` (lines 112-115)

### 5. Redeploy the edge function

Deploy the updated `extract-from-image` edge function with the corrected prompt.

