# Open promos/events in a new tab from listing pages

## Problem
Promo and event cards open their detail page through a JavaScript click handler (`useNavigate`), not a real `<a href>`. The browser therefore offers no "Open link in new tab" (right-click), no Ctrl/Cmd+click, and no middle-click on any listing page (home, /promos, /events, venue pages, list view).

## Approach
Turn the clickable card surfaces into real anchor links. Plain left clicks keep using in-app navigation (no page reload); Ctrl/Cmd+click, right-click → open in new tab, and middle-click use the browser's native link behavior.

## Changes

1. **`src/lib/slug-utils.ts`** — no change (URL helpers already exist).

2. **`src/components/PromoCard.tsx`**
   - Wrap the whole `<Card>` in `<a href={getPromoUrl(promo)} className="block">`.
   - Anchor click handler: if the user used a modifier key (Ctrl/Cmd/Shift) or a non-left button, do nothing (let the browser open the tab); otherwise `preventDefault()` and `navigate(getPromoUrl(promo))`.
   - Nested interactive elements (edit/delete buttons, favorite button, venue-name link) get `preventDefault()` alongside the existing `stopPropagation()` so they don't trigger the anchor's default navigation.

3. **`src/components/EventCard.tsx`**
   - Same pattern: wrap the `<Card>` in an anchor to `getEventUrl(event)` with the same modifier-aware click handler; add `preventDefault()` to nested buttons (join, edit, delete, venue-name click).

4. **`src/components/PromoListView.tsx`**
   - Row click (non-select mode) becomes the same modifier-aware anchor on `getPromoUrl(promo)`, so list rows also support open-in-new-tab. Select mode (admin) keeps toggling selection as today.

5. **Coverage check** — PromoCard/EventCard are used by the home page, /promos, /events, and venue pages, so all listing pages get the behavior at once; no page-level edits needed.

## Verification
- `npx tsgo --noEmit -p tsconfig.app.json`
- Playwright: on /promos, verify each card renders as a link with a real `href`, plain click still navigates in-app, and the venue-name / action buttons don't trigger navigation.
- Bump `APP_VERSION` in `src/lib/version.ts`.
