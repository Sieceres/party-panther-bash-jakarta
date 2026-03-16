

## Change Excel Export Cell Content to Use Description

The "About this Promo" section on the detail page displays `promo.description`. Currently, `buildCellText` in `src/lib/promo-export.ts` prioritizes `discount_text` and appends `description` only if different.

### Change

In `src/lib/promo-export.ts`, update `buildCellText` to:
1. Use `promo.description` as the primary cell content
2. Only fall back to `promo.discount_text` if `description` is empty/missing

```typescript
function buildCellText(promo: PromoForExport): string {
  if (promo.description) return promo.description;
  if (promo.discount_text) return promo.discount_text;
  return "–";
}
```

**File:** `src/lib/promo-export.ts` (lines 27-41)

