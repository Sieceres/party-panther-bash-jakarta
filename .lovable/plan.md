

## Claim This Venue — Implementation Plan

### Overview
Authenticated users can request to claim a venue from its detail page. An admin reviews and approves/rejects claims from the Admin Dashboard. Once approved, the venue owner gains edit/delete control over the venue profile and all linked promos/events.

### Database Changes

**New table: `venue_claims`** to track claim requests separately from venues:

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| venue_id | uuid FK → venues | |
| user_id | uuid | claimant |
| message | text | why they're the owner |
| status | text | pending / approved / rejected |
| reviewed_by | uuid | admin who reviewed |
| reviewed_at | timestamptz | |
| review_note | text | admin note |
| created_at | timestamptz | |

RLS: users can insert (own user_id) and view their own claims; admins can view/update all.

**On approval**: update `venues.claimed_by` and `venues.claim_status = 'approved'` (existing columns already in the schema).

**RLS updates on `promos` and `events`**: add UPDATE and DELETE policies so that if a user is the `claimed_by` owner of the linked `venue_id`, they can manage those records.

### Frontend Changes

1. **VenueDetailPage.tsx** — Add a "Claim This Venue" button (visible to logged-in users when venue is unclaimed and user hasn't already submitted a claim). Opens a dialog with a textarea for a message explaining ownership. Submits to `venue_claims`.

2. **AdminDashboard.tsx** — Add a "Venue Claims" sub-section (could be a new tab or nested under existing Venues tab). Lists pending claims with venue name, claimant profile, message. Admin can Approve (updates venue) or Reject with a note.

3. **VenueDetailPage.tsx** — When `venue.claimed_by === currentUserId`, show venue-owner controls: edit/delete promos and events at that venue (similar to admin controls but scoped).

4. **PromoCard / EventCard** — When the current user is the venue owner, show edit/delete actions on linked promos/events.

### Key Technical Details

- The `venues` table already has `claimed_by` and `claim_status` columns — no schema change needed there.
- New RLS policies on `promos`: `UPDATE/DELETE WHERE venue_id IN (SELECT id FROM venues WHERE claimed_by = auth.uid() AND claim_status = 'approved')`.
- Same pattern for `events`.
- The claim dialog collects a short message (e.g., "I'm the owner, here's my Instagram @venuename") for admin context.
- Admin approval triggers a single update: `venues SET claimed_by = claim.user_id, claim_status = 'approved'` + `venue_claims SET status = 'approved'`.

### File Changes Summary

| File | Change |
|------|--------|
| Migration SQL | Create `venue_claims` table, RLS policies, add promo/event owner policies |
| `src/components/VenueDetailPage.tsx` | Add claim button + dialog, venue owner controls |
| `src/components/AdminDashboard.tsx` | Add Venue Claims tab/section |
| `src/components/AdminVenueClaims.tsx` | New component for reviewing claims |
| `src/components/PromoCard.tsx` | Show edit/delete for venue owners |
| `src/components/EventCard.tsx` | Show edit/delete for venue owners |

