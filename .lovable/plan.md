

## Plan: Promo Voucher / Discount Code Redemption System

### What users will experience

1. **Promo creators** get a new toggle: "Enable voucher redemption" with a choice of single-use or multi-use (with cooldown)
2. **Users** tap "Claim Voucher" on a promo → a unique QR code + alphanumeric code appears in a "My Vouchers" section accessible from their profile
3. **At the venue**, user shows the QR code. Staff scans it with any phone camera → opens a public verification page showing promo name, validity status, and a "Redeem" button
4. **Redemption requires the venue's 4-digit PIN** (set once by the venue owner/admin) to prevent users from self-redeeming
5. After redemption, the voucher is marked as used (single-use) or timestamped for cooldown tracking (multi-use)

### Database changes (migration)

**New table: `promo_vouchers`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| promo_id | uuid FK → promos | |
| user_id | uuid | claimer |
| code | text UNIQUE | 8-char alphanumeric |
| redemption_mode | text | 'single' or 'multi' |
| cooldown_days | integer | null for single-use |
| is_redeemed | boolean | for single-use |
| last_redeemed_at | timestamptz | for multi-use cooldown |
| redemption_count | integer | default 0 |
| created_at | timestamptz | |
| expires_at | timestamptz | matches promo valid_until |

**New table: `venue_pins`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| venue_id | uuid FK → venues | unique |
| pin_hash | text | bcrypt hash of 4-digit PIN |
| created_by | uuid | venue owner or admin |
| created_at | timestamptz | |

**New column on `promos`:**
- `voucher_enabled` boolean default false
- `voucher_mode` text default 'single' (single / multi)
- `voucher_cooldown_days` integer default null

**RLS policies:**
- `promo_vouchers`: users can INSERT (own user_id), SELECT own vouchers; public can SELECT by code (for verification page); admins can see all
- `venue_pins`: only venue owners + admins can INSERT/UPDATE/SELECT

### New edge function: `redeem-voucher`

Handles the verification page's "Redeem" action:
1. Accepts `{ code, venue_pin }`
2. Looks up the voucher + linked promo + venue
3. Verifies the PIN against `venue_pins` (bcrypt compare)
4. Checks validity (not expired, not already redeemed / cooldown not elapsed)
5. Marks as redeemed, increments count
6. Returns success/failure with promo details

### Frontend changes

**File: `src/components/CreatePromoForm.tsx` + `EditPromoPage.tsx`**
- Add "Enable Voucher" toggle + mode selector (single/multi) + cooldown input (if multi)

**New file: `src/components/VoucherDisplay.tsx`**
- Shows QR code (using `qrcode.react` library) encoding the verification URL: `{site}/voucher/{code}`
- Shows alphanumeric code as fallback
- Shows redemption status and history

**New file: `src/components/UserVouchers.tsx`**
- "My Vouchers" section in user profile, listing all claimed vouchers with status

**New file: `src/pages/VoucherVerify.tsx`**
- Public page at `/voucher/:code`
- Shows promo name, venue, validity, discount details
- PIN input field + "Redeem" button
- Calls the `redeem-voucher` edge function
- Shows success/error state clearly

**File: `src/components/PromoDetailPage.tsx`**
- Replace current dummy "Claim Promo" button with actual voucher claim logic
- On claim: generates a voucher row in `promo_vouchers`, shows the QR code

**File: `src/components/VenueDetailPage.tsx`**
- For venue owners: "Set Redemption PIN" button that lets them set/update their 4-digit PIN

**File: `src/App.tsx`**
- Add route `/voucher/:code` → `VoucherVerify`

### Technical notes

- QR code library: `qrcode.react` (lightweight, no server needed)
- Code generation: 8-char alphanumeric (base36), generated client-side with uniqueness enforced by DB unique constraint + retry
- PIN hashing done in the edge function using Web Crypto API (not bcrypt in Deno -- use PBKDF2 or store as simple hash since it's a 4-digit PIN with rate limiting)
- Cooldown check: `last_redeemed_at + cooldown_days > now()` in the edge function
- No payments integration for now -- all claims are free

