# Party Panther auth email templates

These are the branded templates for the Supabase auth emails.
Paste them into: Supabase Dashboard → Authentication → Emails → Templates.

Also set, in Authentication → Emails → SMTP Settings:
- Sender name: `Party Panther`
- Sender email: e.g. `no-reply@partypanther.net` (needs custom SMTP; the default Supabase sender
  cannot be renamed and is rate limited to a few emails/hour)

And in Authentication → URL Configuration:
- Site URL: `https://partypanther.net`
- Redirect URLs: `https://partypanther.net/**`, `https://*.lovable.app/**`, `http://localhost:8080/**`

Subjects:
- Confirm signup: `Confirm your Party Panther account`
- Magic Link: `Your Party Panther sign-in link`
- Reset Password: `Reset your Party Panther password`

Note: the reset template must link to `{{ .ConfirmationURL }}` (Supabase fills in the
redirect set by the app: `https://partypanther.net/reset-password`).
