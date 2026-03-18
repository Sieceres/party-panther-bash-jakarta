
-- Create notification_settings table
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text UNIQUE NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS: admins can read
CREATE POLICY "Admins can view notification settings"
  ON public.notification_settings FOR SELECT
  TO authenticated
  USING (has_admin_role(auth.uid()));

-- RLS: admins can update
CREATE POLICY "Admins can update notification settings"
  ON public.notification_settings FOR UPDATE
  TO authenticated
  USING (has_admin_role(auth.uid()));

-- Seed all notification types enabled by default
INSERT INTO public.notification_settings (notification_type, enabled) VALUES
  ('new_report', true),
  ('new_user', true),
  ('new_promo', true),
  ('new_event', true),
  ('new_venue', true),
  ('new_venue_claim', true),
  ('new_review', true),
  ('new_venue_edit', true),
  ('user_flagged', true);
