## Goal

Replace the redirect-based Google login inside `LoginDialog` with Google's **Identity Services (GIS)** popup using `supabase.auth.signInWithIdToken`. The user signs in without ever leaving `partypanther.net`, so the scary `qgttbaibhmzbmknjlghj.supabase.co` URL never appears.

Scope: **LoginDialog only**. The `/auth` page keeps the existing redirect flow as a fallback (useful for OAuth edge cases and mobile in-app browsers where GIS isn't supported).

---

## What you need to do in Google Cloud Console (I'll walk you through)

You already have a Google OAuth client (the one currently used for the redirect flow). We'll reuse it — just need to add your site origins.

1. Open https://console.cloud.google.com/apis/credentials
2. Pick your project → click the existing **OAuth 2.0 Client ID** (Web application) you use for Supabase.
3. Under **Authorized JavaScript origins**, add:
   - `https://partypanther.net`
   - `https://www.partypanther.net`
   - `https://partypanther.lovable.app`
   - `https://id-preview--1ebb9f24-fda5-4dae-ac77-480d72954427.lovable.app`
   - `http://localhost:5173` (for local dev, optional)
4. **Authorized redirect URIs** — leave as-is (still needed for the `/auth` redirect fallback).
5. Copy the **Client ID** (looks like `xxxxxxxxxxxx-xxxxxxxxxx.apps.googleusercontent.com`) and paste it to me in chat.
6. In Supabase Dashboard → Authentication → Providers → **Google**, scroll to **Authorized Client IDs** and add the same Client ID there (this lets Supabase trust ID tokens issued to it).

The Client ID is **public** — safe to commit. No secret needed.

---

## What I'll build

### 1. Load the GIS script
Add `<script src="https://accounts.google.com/gsi/client" async defer></script>` to `index.html`.

### 2. New hook: `src/hooks/useGoogleOneTap.ts`
- Generates a random nonce, SHA-256 hashes it.
- Initializes `google.accounts.id` with the Client ID and hashed nonce.
- Renders Google's official "Sign in with Google" button into a target div.
- On callback, calls `supabase.auth.signInWithIdToken({ provider: 'google', token: credential, nonce: rawNonce })`.
- Returns `{ buttonRef, loading, error }`.

### 3. Update `src/components/LoginDialog.tsx`
- Replace the current custom "Continue with Google" `<Button>` (which calls `signInWithOAuth` and redirects) with a `<div ref={buttonRef}>` that GIS renders the official Google button into.
- Keep the email/password tabs untouched.
- On successful sign-in: close dialog, fire `onSuccess?.()` (same as today).
- Client ID stored as `const GOOGLE_CLIENT_ID = "..."` at top of the hook (public value).

### 4. Leave `/auth` page alone
The redirect flow stays as a fallback. Most users hit the dialog anyway.

---

## Technical notes

- **Nonce flow** (required for security):
  ```ts
  const rawNonce = crypto.randomUUID();
  const hashed = btoa(String.fromCharCode(...new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce))
  )));
  // pass `hashed` to GIS, pass `rawNonce` to supabase.signInWithIdToken
  ```
- **FedCM**: GIS now requires `use_fedcm_for_prompt: true` in Chrome. We'll enable it.
- **Fallback**: if GIS fails to load (ad-blockers, in-app browsers), show a small "Use redirect sign-in instead" link that calls the existing `signInWithOAuth`.
- No DB changes, no edge functions, no new secrets.

---

## Files touched

- `index.html` — add GIS script tag
- `src/hooks/useGoogleOneTap.ts` — new
- `src/components/LoginDialog.tsx` — swap Google button for GIS-rendered button + fallback link

---

## What I need from you to start

1. The **Google OAuth Web Client ID** (after you add the origins above).
2. Confirmation that you've added it to Supabase's **Authorized Client IDs** list.

Once you paste the Client ID, I'll implement the three file changes.