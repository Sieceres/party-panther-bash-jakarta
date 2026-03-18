

## Expanded Notification System

### Notification Types

Here are all the notification categories worth covering:

| Category | Trigger | Emoji |
|----------|---------|-------|
| `new_report` | Existing — user submits a report | 🚨 |
| `new_user` | User signs up (profile created) | 👤 |
| `new_promo` | Promo inserted | 🎉 |
| `new_event` | Event created | 📅 |
| `new_venue` | Venue added | 📍 |
| `new_venue_claim` | Venue claim submitted | 🏢 |
| `new_review` | Promo review posted | ⭐ |
| `new_venue_edit` | Venue edit suggestion submitted | ✏️ |
| `user_flagged` | Auto-spam flag triggered | ⚠️ |

### Database Changes

**New table: `notification_settings`** — stores which notification types are enabled (singleton config row per type).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| notification_type | text UNIQUE | e.g. `new_user`, `new_promo` |
| enabled | boolean | default true |
| updated_at | timestamptz | |
| updated_by | uuid | admin who last changed it |

Seed it with all types enabled by default. RLS: admins can read/update; no public access.

### Edge Function Changes

**Refactor `notify-report` → `notify-admin`** (or create new `notify-admin` alongside):
- Accepts a generic `{ type, title, details, link }` payload
- Checks `notification_settings` table to see if `type` is enabled before sending
- Formats the message based on type with appropriate emoji/template
- Still sends via Telegram gateway

### Frontend: Trigger Notifications

Add `supabase.functions.invoke('notify-admin', { body: {...} })` calls (fire-and-forget) at these points in existing code:

- **New user**: In `handle_new_user` DB trigger — better done as a DB webhook or a second edge function triggered by DB. Alternatively, call from `Auth.tsx` after successful signup.
- **New promo**: After successful insert in promo creation form
- **New event**: After successful insert in event creation form  
- **New venue**: After successful insert in `AddVenueDialog`
- **New venue claim**: After claim submission in `VenueDetailPage`
- **New review**: After review submission in `ReviewForm`
- **New venue edit**: After edit submission in `VenueEditDialog`
- **User flagged**: Already handled by DB triggers — add a DB trigger that calls the edge function via `pg_net`

### Frontend: Admin Notification Settings UI

New component `AdminNotificationSettings.tsx`:
- Grid/list of all notification types with toggle switches
- Each toggle updates `notification_settings` table
- Add as a new tab or sub-section in `AdminDashboard.tsx` (e.g., "Notifications" tab with a Bell icon)

### File Changes Summary

| File | Change |
|------|--------|
| Migration SQL | Create `notification_settings` table, seed defaults, RLS |
| `supabase/functions/notify-admin/index.ts` | New generic notification edge function |
| `supabase/config.toml` | Register `notify-admin` function |
| `src/components/AdminNotificationSettings.tsx` | New — toggle UI for each notification type |
| `src/components/AdminDashboard.tsx` | Add Notifications tab |
| `src/components/ReportDialog.tsx` | Update to call `notify-admin` instead of `notify-report` |
| `src/components/EventForm.tsx` | Add notify call after event creation |
| `src/components/CreatePromoForm.tsx` | Add notify call after promo creation |
| `src/components/AddVenueDialog.tsx` | Add notify call after venue creation |
| `src/components/VenueDetailPage.tsx` | Add notify call after claim submission |
| `src/components/ReviewForm.tsx` | Add notify call after review submission |
| `src/components/VenueEditDialog.tsx` | Add notify call after edit submission |
| Auth signup flow | Add notify call after successful registration |

