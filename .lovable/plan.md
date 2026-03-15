

## Re-categorize Existing Promos

### Problem
Currently 30 promos are tagged "Free Flow" but almost none are actual free-flow (unlimited) deals. They're mostly:
- **Happy Hour**: "Buy 1 Get 1", discounted cocktails/beer, time-limited deals (e.g., "Cocktails IDR 88k", "50% Off All Drinks")
- **Bucket Deal**: "Buy 2 Get 3", "5 Beers for IDR 350k", "Bucket Beer 4 Bintang IDR 150k"

61 promos are "Other" which could also benefit from better classification. 4 have null promo_type.

### Approach: Admin "Re-categorize" Button

Add a button in the Admin Dashboard that runs all promos through a server-side re-classification using the AI (same Gemini model used for extraction). This is more reliable than client-side keyword matching because the AI can understand context.

### Implementation

**1. New edge function `reclassify-promos`**
- Fetches all promos from DB (using service role)
- For each promo, sends `title` + `discount_text` + `description` to the AI with strict promo type enum and classification rules
- Batches updates back to DB
- Returns a summary of changes

**2. Admin UI trigger**
- Add a "Re-categorize Promos" button in `AdminDashboard.tsx`
- Shows progress and a summary of changes when complete
- Requires admin auth

**3. Classification rules (in the AI prompt)**
- "Free Flow" = ONLY unlimited/all-you-can-drink
- "Happy Hour" = time-limited discounts, Buy 1 Get 1, percentage off
- "Bucket Deal" = multi-buy bundles (Buy 2 Get 3, 5 for X, bucket deals)
- "Bottle Promo" = bottle service deals
- "Ladies Night" = ladies-specific deals
- etc.

### Alternative: Simpler keyword-based approach (no AI cost)

Instead of AI, use deterministic rules on `title` + `discount_text`:
- Contains "bucket" or "X beers for" or "buy 2 get 3" → Bucket Deal
- Contains "happy hour" or "buy 1 get 1" or "B1G1" or "% off" or specific price → Happy Hour  
- Contains "free flow" or "unlimited" or "all you can drink" → Free Flow
- Contains "ladies" → Ladies Night
- Contains "brunch" → Brunch Deal
- Contains "bottle" and price → Bottle Promo
- Contains "live music" or "DJ" → Live Music

This is cheaper, faster, and fully deterministic. Can be run client-side from admin panel.

### Recommended: Hybrid approach

1. Create a `reclassifyPromoType(title, discountText, description)` function in `src/lib/promo-types.ts` with keyword rules
2. Add an admin button that fetches all promos, runs the function, and batch-updates changed ones
3. No edge function needed — just client-side logic + Supabase updates

### Files to change
- `src/lib/promo-types.ts` — add `reclassifyPromoType()` function
- `src/components/AdminDashboard.tsx` — add "Re-categorize Promos" button that fetches all promos, reclassifies, and updates

