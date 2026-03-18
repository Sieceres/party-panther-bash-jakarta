

## Problem

The Bell icon in the header navigates to `/admin?tab=reports`, which works correctly when navigating **from another page**. However, when **already on the admin page**, clicking the Bell does nothing because:

1. React Router's `navigate('/admin?tab=reports')` is a no-op if the URL is already `/admin?tab=reports`
2. The `AdminDashboard` reads `defaultTab` only once on mount via `new URLSearchParams(window.location.search).get('tab')`, so even navigating from `/admin?tab=analytics` to `/admin?tab=reports` won't switch tabs — the Tabs component's `defaultValue` is set once and doesn't update

## Fix

### 1. Make AdminDashboard respond to URL tab changes (AdminDashboard.tsx)
- Replace `defaultValue={defaultTab}` with controlled `value` + `onValueChange`
- Use `useSearchParams()` from react-router-dom to read and sync the active tab with the URL
- When the tab changes via click, update the URL search params
- When the URL changes (e.g., Bell click), the tab updates reactively

### 2. Force navigation even when on same route (Header.tsx)  
- Change the Bell's `onClick` to use `navigate('/admin?tab=reports', { replace: true })` or add a timestamp to force re-render — but with the controlled tab approach above, this becomes unnecessary since `useSearchParams` will handle it reactively

## Technical Details

In `AdminDashboard.tsx`:
- Import `useSearchParams` from `react-router-dom`
- Replace the `defaultTab` const with `const [searchParams, setSearchParams] = useSearchParams()`
- Derive `activeTab` from `searchParams.get('tab') || 'analytics'`
- Change `<Tabs defaultValue={defaultTab}>` to `<Tabs value={activeTab} onValueChange={(val) => setSearchParams({ tab: val })}>`

This single change makes the Bell work from anywhere, and also keeps the URL in sync when manually switching tabs in the dashboard.

