

## In-App User Notification System + Review Enhancements

This is a significant feature set. Here's the plan broken into two phases.

---

### Phase 1: In-App Notifications

#### Database

Create a `user_notifications` table:

```text
user_notifications
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users, NOT NULL)
├── type (text, NOT NULL)  -- 'claim_result', 'new_review', 'event_join', 'event_comment', 'review_reply'
├── title (text, NOT NULL)
├── message (text, NOT NULL)
├── link (text)            -- e.g. /promo/my-promo, /event/my-event
├── is_read (boolean, default false)
├── metadata (jsonb, default '{}')  -- for grouping context
├── created_at (timestamptz, default now())
```

RLS: users can SELECT/UPDATE (mark read) their own notifications only. INSERT via service role (edge functions / triggers).

#### Notification Sources

Notifications are created server-side. For each trigger:

1. **Claim result** -- when admin updates `venue_claims.status`, a DB trigger inserts a notification for the claimant (approved/rejected message with link to venue).
2. **New review on your promo** -- DB trigger on `promo_reviews` INSERT looks up `promos.created_by` and inserts notification.
3. **Someone joins your event** -- DB trigger on `event_attendees` INSERT looks up `events.created_by` and inserts notification.
4. **Comment on your event** -- DB trigger on `event_comments` INSERT looks up `events.created_by` and inserts notification.
5. **Review reply** (Phase 2) -- when venue owner replies to a review, notify the reviewer.

All triggers use `SECURITY DEFINER` to bypass RLS for the INSERT.

#### UI: User Notification Bell

- Add a Bell icon to the Header for **all authenticated users** (separate from the admin bell).
- Shows unread count badge.
- Clicking opens a Popover/dropdown listing recent notifications, grouped by type.
- Each notification is clickable (navigates to `link`).
- "Mark all as read" button.
- Notifications older than 30 days can be auto-cleaned via a cron job later.

#### Files Changed
- **New migration**: `user_notifications` table + RLS + triggers for claim result, new review, event join, event comment
- **Header.tsx**: Add user notification bell (separate from admin bell), fetch unread count, render dropdown
- **New component**: `UserNotificationBell.tsx` -- encapsulates the bell, popover, and notification list

---

### Phase 2: Review Enhancements

#### Anonymous Reviews

- Add `is_anonymous` boolean column (default `false`) to `promo_reviews`.
- In `ReviewForm.tsx`, add a toggle: "Post anonymously" with helper text ("Your name will be hidden from the venue owner but visible to admins").
- In `ReviewsList.tsx`, when `is_anonymous = true`, show "Anonymous Reviewer" instead of the user's name/avatar. Admins still see the real name.

#### Venue Owner Replies

- Create `review_replies` table:
  ```text
  review_replies
  ├── id (uuid, PK)
  ├── review_id (uuid, FK → promo_reviews, NOT NULL, UNIQUE)
  ├── user_id (uuid, NOT NULL)  -- the replier (venue owner)
  ├── comment (text, NOT NULL)
  ├── created_at, updated_at
  ```
- RLS: anyone can SELECT. INSERT/UPDATE only if user is the venue owner of the promo's venue (`promos.venue_id → venues.claimed_by`).
- One reply per review (UNIQUE on `review_id`).
- In `ReviewsList.tsx`, show the reply indented below the review with a "Venue Owner" badge.
- Add a "Reply" button visible only to the venue owner.
- DB trigger on INSERT notifies the reviewer (creates `user_notifications` entry with type `review_reply`).

#### Files Changed
- **New migration**: `is_anonymous` column on `promo_reviews`, `review_replies` table + RLS + notification trigger
- **ReviewForm.tsx**: Add anonymous toggle
- **ReviewsList.tsx**: Respect `is_anonymous`, show replies, add reply button for venue owners
- **New component**: `ReviewReplyForm.tsx` -- inline reply form for venue owners

---

### Summary of Deliverables

| Feature | Scope |
|---|---|
| `user_notifications` table + triggers | Migration |
| User notification bell in header | Header.tsx + new component |
| Claim result notification | DB trigger |
| Review/join/comment notifications | DB triggers |
| Anonymous review toggle | Migration + ReviewForm + ReviewsList |
| Venue owner review replies | Migration + new table + ReviewsList + new component |

### Implementation Order
1. `user_notifications` table + RLS + all triggers (single migration)
2. `UserNotificationBell` component + integrate into Header
3. `is_anonymous` column + ReviewForm toggle + ReviewsList update
4. `review_replies` table + reply UI + notification trigger

