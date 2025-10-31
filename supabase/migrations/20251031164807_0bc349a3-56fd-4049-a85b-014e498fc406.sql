-- Add venue-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN venue_whatsapp text,
ADD COLUMN venue_address text,
ADD COLUMN venue_opening_hours text,
ADD COLUMN venue_status text DEFAULT 'none' CHECK (venue_status IN ('none', 'pending', 'verified', 'rejected')),
ADD COLUMN venue_applied_at timestamp with time zone,
ADD COLUMN venue_verified_at timestamp with time zone,
ADD COLUMN venue_verified_by uuid REFERENCES auth.users(id);

-- Create contact_logs table for tracking communications
CREATE TABLE public.contact_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contacted_by uuid NOT NULL REFERENCES auth.users(id),
  contact_date timestamp with time zone NOT NULL DEFAULT now(),
  contact_method text NOT NULL CHECK (contact_method IN ('phone', 'whatsapp', 'email', 'in-person', 'other')),
  notes text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on contact_logs
ALTER TABLE public.contact_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view contact logs
CREATE POLICY "Admins can view all contact logs"
ON public.contact_logs
FOR SELECT
USING (is_current_user_admin());

-- RLS Policy: Only admins can create contact logs
CREATE POLICY "Admins can create contact logs"
ON public.contact_logs
FOR INSERT
WITH CHECK (is_current_user_admin() AND auth.uid() = contacted_by);

-- RLS Policy: Only admins can update contact logs
CREATE POLICY "Admins can update contact logs"
ON public.contact_logs
FOR UPDATE
USING (is_current_user_admin());

-- RLS Policy: Only admins can delete contact logs
CREATE POLICY "Admins can delete contact logs"
ON public.contact_logs
FOR DELETE
USING (is_current_user_admin());

-- RLS Policy: Users can update their own venue application fields
CREATE POLICY "Users can apply to be venues"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND
  -- Users can only update their venue application fields, not verification fields
  (venue_status IS NULL OR venue_status IN ('none', 'pending'))
);

-- RLS Policy: Only admins can verify venues
CREATE POLICY "Admins can verify venues"
ON public.profiles
FOR UPDATE
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Add trigger for updating updated_at on contact_logs
CREATE TRIGGER update_contact_logs_updated_at
BEFORE UPDATE ON public.contact_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster contact log queries
CREATE INDEX idx_contact_logs_contact_id ON public.contact_logs(contact_id);
CREATE INDEX idx_contact_logs_contacted_by ON public.contact_logs(contacted_by);
CREATE INDEX idx_contact_logs_contact_date ON public.contact_logs(contact_date DESC);