

## Add Edit & Report Actions to Promo Detail Page

### What changes

**1. PromoDetailPage.tsx** — Add edit button for creator/admins, update report for other users

- Fetch current user and admin status on mount
- Show an "Edit Promo" button (links to `/edit-promo/:id`) if the current user is the promo creator or has admin role
- For non-creators, keep the existing ReportDialog but update it to use promo-specific report reasons
- The edit/report buttons replace the current static ReportDialog placement in the sidebar

**2. ReportDialog.tsx** — Update promo report reasons

Replace the current generic promo reasons with the selected options:
- "Expired / no longer valid"
- "Wrong venue info"
- "Incorrect pricing / discount"
- "Wrong day / schedule"
- "Duplicate promo"
- "Spam / not a real promo"
- "Inappropriate content"
- "Other"

**3. Route check** — Confirm `/edit-promo/:id` route exists

The `EditPromoPage` component already exists. Need to verify the route is registered in `App.tsx`.

### Technical details

- Use `checkUserAdminStatus` from `src/lib/auth-helpers.ts` to determine admin status
- Compare `promo.created_by` against `user.id` for creator check
- Conditionally render Edit button (creator/admin) vs Report button (everyone else)
- The ReportDialog `reasonOptions.promo` array gets replaced with the 8 options above

### Files to modify
- `src/components/PromoDetailPage.tsx` — add user/admin state, conditional edit button
- `src/components/ReportDialog.tsx` — update promo reason options

