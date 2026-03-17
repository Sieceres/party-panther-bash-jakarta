

## 1. Promo Type Pill Badge on PromoCard

Add a `Badge` in the image overlay area (bottom-left of the image) showing the promo's `category` (promo type). Only render when category exists and is non-empty.

**File: `src/components/PromoCard.tsx`**
- After the image overlay div, add a positioned badge: `absolute bottom-3 left-3`
- Use a semi-transparent background style to keep it readable over images
- Display `promo.category` text

---

## 2. Admin Promo Category Review Mode

Create a new component `PromoReviewPanel` — a fixed floating panel (bottom-right or side) visible only to admins, toggled by a button in the PromosSection.

**New file: `src/components/PromoReviewPanel.tsx`**
- Receives the `filteredPromos` array and admin status
- Shows a compact panel with: current promo title, venue, current category, and the keyboard shortcut legend
- Highlights the currently selected promo (index-based)
- Keyboard listeners (on `window`):
  - `Q` → previous promo (decrement index)
  - `A` → next promo
  - `H` → set Happy Hour, `S` → Ladies Night, `F` → Free Flow, `B` → Bottle Promo, `D` → Bucket Deal, `T` → Other
- On category change: update via `supabase.from('promos').update({ category: newType }).eq('id', promoId)`, show toast, update local state
- Auto-scrolls the selected PromoCard into view using a ref or `document.getElementById`
- Disables shortcuts when any input/textarea is focused (to avoid conflicts with search)

**File: `src/components/sections/PromosSection.tsx`**
- Add a "Review Categories" toggle button (admin-only)
- Render `PromoReviewPanel` when active, passing `filteredPromos`

**File: `src/components/PromoCard.tsx`**
- Accept an optional `isSelected` prop to show a highlight ring (e.g., `ring-2 ring-primary`) when the card is the active one in review mode
- Add `id={`promo-card-${promo.id}`}` to the Card for scroll-into-view targeting

**File: `src/components/sections/PromosSection.tsx`**
- Track `selectedPromoId` state, pass it down to each PromoCard

### Keyboard Shortcut Map
| Key | Action |
|-----|--------|
| Q | Select previous promo |
| A | Select next promo |
| H | Set → Happy Hour |
| S | Set → Ladies Night |
| F | Set → Free Flow |
| B | Set → Bottle Promo |
| D | Set → Bucket Deal |
| T | Set → Other |

