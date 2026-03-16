

## Three Features: Admin Reports Tab, Notification Bell, Telegram Bot Alerts

### 1. Admin Reports Management Tab

**New file:** `src/components/AdminReportManagement.tsx`
- Query `reports` table for all reports (admins have full access via existing RLS policy)
- Display reports in a table/card list with: target type, target title, reason, description, reporter, status, created_at
- Filter by status (pending/resolved/dismissed) and target type (promo/event/profile/comment)
- Action buttons: Resolve, Dismiss, View Target (navigate to the reported item)
- Update report `status` field on action
- Show pending count as a badge

**Modify:** `src/components/AdminDashboard.tsx`
- Add `<TabsTrigger value="reports">Reports</TabsTrigger>` with a pending count badge
- Add corresponding `<TabsContent>` rendering `<AdminReportManagement />`
- Fetch pending report count on load for the badge

### 2. In-App Notification Bell (Header)

**Modify:** `src/components/Header.tsx`
- Add a `Bell` icon button next to nav items, visible only to admin users
- Query `reports` table for `status = 'pending'` count on mount
- Show count badge on the bell icon when > 0
- Clicking the bell navigates to `/admin` (reports tab) via `navigate('/admin?tab=reports')`

**Modify:** `src/components/AdminDashboard.tsx`
- Read `tab` query param from URL to set the default active tab, so the bell link opens directly to the Reports tab

### 3. Telegram Bot Notifications

Send a Telegram message to a configured admin chat whenever a new report is submitted.

**Connect:** Telegram connector via `standard_connectors--connect`

**New edge function:** `supabase/functions/notify-report/index.ts`
- Receives report data (reason, target_type, target_title, description)
- Sends a formatted message to a configured Telegram chat ID via the connector gateway
- Called from the client after a successful report submission

**Modify:** `src/components/ReportDialog.tsx`
- After successfully inserting a report, call `supabase.functions.invoke('notify-report', { body: { reason, target_type, target_title, description } })`

**Config:** `supabase/config.toml` — add `[functions.notify-report]` with `verify_jwt = false`

### Technical notes

- The `reports` table already has proper RLS: admins can do ALL, users can view their own and create
- The Telegram connector provides `TELEGRAM_API_KEY` and uses `LOVABLE_API_KEY` for the gateway
- A Telegram chat ID for admin notifications will need to be stored as a secret or hardcoded after setup
- No database schema changes needed — all tables exist

### Files to create/modify
- **Create:** `src/components/AdminReportManagement.tsx`
- **Create:** `supabase/functions/notify-report/index.ts`
- **Modify:** `src/components/AdminDashboard.tsx` (add Reports tab + URL param handling)
- **Modify:** `src/components/Header.tsx` (add bell icon for admins)
- **Modify:** `src/components/ReportDialog.tsx` (call notify edge function after submit)
- **Modify:** `supabase/config.toml` (add notify-report function)

