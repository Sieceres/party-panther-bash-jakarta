
-- Add voucher columns to promos
ALTER TABLE public.promos
  ADD COLUMN IF NOT EXISTS voucher_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS voucher_mode text NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS voucher_cooldown_days integer DEFAULT NULL;

-- Create promo_vouchers table
CREATE TABLE public.promo_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid NOT NULL REFERENCES public.promos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  redemption_mode text NOT NULL DEFAULT 'single',
  cooldown_days integer DEFAULT NULL,
  is_redeemed boolean NOT NULL DEFAULT false,
  last_redeemed_at timestamptz DEFAULT NULL,
  redemption_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz DEFAULT NULL
);

ALTER TABLE public.promo_vouchers ENABLE ROW LEVEL SECURITY;

-- Users can insert vouchers for themselves
CREATE POLICY "Users can claim vouchers" ON public.promo_vouchers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own vouchers
CREATE POLICY "Users can view own vouchers" ON public.promo_vouchers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Public can view voucher by code (for verification page)
CREATE POLICY "Anyone can view voucher by code" ON public.promo_vouchers
  FOR SELECT TO public
  USING (true);

-- Admins can see all vouchers
CREATE POLICY "Admins can manage vouchers" ON public.promo_vouchers
  FOR ALL TO authenticated
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Create venue_pins table
CREATE TABLE public.venue_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE UNIQUE,
  pin_hash text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.venue_pins ENABLE ROW LEVEL SECURITY;

-- Venue owners and admins can manage pins
CREATE POLICY "Venue owners can manage pins" ON public.venue_pins
  FOR ALL TO authenticated
  USING (
    is_current_user_admin()
    OR created_by = auth.uid()
    OR venue_id IN (
      SELECT id FROM public.venues
      WHERE claimed_by = auth.uid() AND claim_status = 'approved'
    )
  )
  WITH CHECK (
    is_current_user_admin()
    OR auth.uid() = created_by
  );
