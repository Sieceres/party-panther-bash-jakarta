

## Merge Venue Claims into the Bell Notification

### What changes

1. **Header.tsx** - Expand the bell to count both pending reports AND pending venue claims. The badge shows a combined total. Clicking the bell opens a dropdown (popover) with two sections instead of navigating directly:
   - "Pending Reports (N)" -- clicking navigates to `/admin?tab=reports`
   - "Pending Claims (N)" -- clicking navigates to `/admin?tab=venue-claims`

2. **Header.tsx** - Add a second query in `fetchPendingReportCount` (rename to `fetchPendingCounts`) that also counts `venue_claims` where `status = 'pending'`. Store both counts separately for the dropdown, but sum them for the badge number.

### Technical details

- Add `pendingClaimCount` state alongside `pendingReportCount`
- Fetch both counts in parallel with `Promise.all`
- Replace the plain `Button` with a `Popover` (already available in the UI library) containing two clickable rows, each showing a label and count badge
- The bell badge shows `pendingReportCount + pendingClaimCount`
- Each row in the popover navigates to the appropriate admin tab and closes the popover
- Title attribute updated to "Admin notifications"

### Scope

- Only `src/components/Header.tsx` is modified
- No database or migration changes needed (venue_claims table already has a `status` column with RLS for admin reads)

