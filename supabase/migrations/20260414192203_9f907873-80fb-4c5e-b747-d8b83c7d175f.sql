
-- Add telegram_chat_id to profiles
ALTER TABLE public.profiles ADD COLUMN telegram_chat_id text;

-- Create telegram_link_codes table
CREATE TABLE public.telegram_link_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used boolean NOT NULL DEFAULT false
);

ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;

-- Service role needs full access (used by edge function polling)
-- Authenticated users can create codes for themselves
CREATE POLICY "Users can create their own link codes"
ON public.telegram_link_codes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own codes
CREATE POLICY "Users can view own link codes"
ON public.telegram_link_codes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Index for quick code lookup
CREATE INDEX idx_telegram_link_codes_code ON public.telegram_link_codes (code);
CREATE INDEX idx_telegram_link_codes_user ON public.telegram_link_codes (user_id);
