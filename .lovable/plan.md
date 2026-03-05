

## Plan: Apply Drink Categorization to Existing Promos

No need to re-upload. We can write a one-time migration script that runs client-side (or as an admin action) to backfill existing promos that have no `image_url` (or a default/empty one) with the correct placeholder based on their title, description, discount_text, and drink_type fields.

### Approach

1. **Add an "Auto-categorize" button to the Admin Dashboard** that:
   - Fetches all promos from the database
   - Runs `detectDrinkCategory()` on each promo's title, description, discount_text, and drink_type
   - Updates promos that have a null/empty `image_url` (or optionally all promos without a custom uploaded image) with the matching placeholder path
   - Also enriches empty `drink_type` arrays with the detected category label
   - Reports how many promos were updated

2. **Update PromoCard fallback image** to use the drink category detection at render time, so even without running the migration, promos without images will show the right placeholder instead of the generic Unsplash fallback.

### Changes

- **`src/components/PromoCard.tsx`**: Import `detectDrinkCategory` and `getPlaceholderImage`. In the image `src`, replace the Unsplash fallback with a category-aware placeholder based on the promo's fields.

- **`src/components/AdminDashboard.tsx`**: Add a "Backfill Promo Images" button that fetches all promos, runs categorization, and batch-updates `image_url` and `drink_type` for promos missing them.

The PromoCard change alone gives immediate visual improvement without any database writes. The admin backfill permanently stores the correct placeholder and drink_type in the database.

