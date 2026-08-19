ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS payment_methods jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payment_qr_url text;