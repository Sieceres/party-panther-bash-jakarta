

## Anti-Sabotage Protection System

Based on your concerns, here is a plan covering three features: **Bulk Purge User Activity**, **User Ban/Suspend System**, and **Auto-Flag Suspicious Activity**.

---

### 1. Bulk Purge User Activity

Add a "Purge Activity" button on each user row in the Admin Dashboard Users tab. When clicked, it calls the existing `secure-delete` edge function (extended) or a new edge function that deletes all of a target user's:
- Event comments
- Promo comments
- Promo reviews
- Reports they submitted
- Event attendee records
- Event photos they uploaded

**Changes:**
- **New edge function `supabase/functions/purge-user-activity/index.ts`**: Accepts `target_user_id`, authenticates the caller as admin, then deletes all activity rows for that user using the service role client. Returns counts of deleted items.
- **`src/components/AdminDashboard.tsx`**: Add a "Purge Activity" action button per user with a confirmation dialog showing what will be deleted. Call the edge function on confirm.
- **`supabase/config.toml`**: Register the new function with `verify_jwt = false`.

---

### 2. User Ban/Suspend System

Add a `banned_users` table and middleware to block banned users from performing actions.

**Database changes (migration):**
- Create `banned_users` table: `id`, `user_id` (unique, references nothing to avoid auth schema issues), `banned_by`, `reason`, `banned_at`, `expires_at` (nullable, for temporary bans), `created_at`.
- RLS: Admins can manage; no public access.
- Create a `public.is_user_banned(uuid)` security definer function that checks if a user has an active (non-expired) ban.

**Frontend changes:**
- **`src/components/AdminDashboard.tsx`**: Add "Ban User" / "Unban User" button per user row. Ban dialog collects reason and optional expiry duration.
- **Key action points** (event creation, promo creation, commenting, reviewing): Add a check before mutation — call `is_user_banned` or query `banned_users` — and show a toast if banned.
- **`src/lib/auth-helpers.ts`**: Add `checkUserBanStatus()` helper.

---

### 3. Auto-Flag Suspicious Activity

Surface suspicious user behavior in the Admin Dashboard using a lightweight scoring approach.

**Database changes (migration):**
- Create `user_flags` table: `id`, `user_id`, `flag_type` (enum: `spam_reviews`, `spam_comments`, `spam_reports`, `rapid_activity`), `details` (jsonb), `is_resolved` (boolean), `created_at`, `resolved_by`, `resolved_at`.
- RLS: Admin-only access.

**Edge function or DB trigger approach:**
- Add a **database trigger** on `promo_reviews` INSERT that checks: if a user has submitted 5+ reviews in the last hour, or 80%+ are 1-star, insert a flag into `user_flags`. (Extends the existing `check_review_fraud` function that currently only logs a warning.)
- Similar trigger on `reports` INSERT: if a user submits 3+ reports in an hour, auto-flag.
- Similar trigger on `event_comments` / `promo_comments`: if 5+ comments in 10 minutes, flag.

**Frontend changes:**
- **`src/components/AdminDashboard.tsx`**: Add a "Flags" tab or section showing unresolved flags with user info, flag type, and timestamp. Admin can click to view the user, purge activity, or ban.
- Badge count on the Flags tab similar to Reports.

---

### Implementation Order

1. Bulk Purge (most immediately useful — new edge function + UI button)
2. Ban System (database table + checks at key action points)
3. Auto-Flag (triggers + flags table + admin UI)

### Technical Notes

- The purge edge function follows the same auth pattern as `secure-delete`: validate JWT, check admin role via `user_roles`, then use service role client for deletions.
- Ban checks on the frontend are a UX convenience; the real enforcement should also be in RLS policies or edge functions to prevent API-level bypass. We can add an RLS helper: `NOT is_user_banned(auth.uid())` to INSERT policies on key tables.
- Auto-flag triggers use `SECURITY DEFINER` to insert into `user_flags` without needing the inserting user to have access.

