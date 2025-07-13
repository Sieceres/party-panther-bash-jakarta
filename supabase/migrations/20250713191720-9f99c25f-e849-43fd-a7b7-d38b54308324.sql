-- Add admin role system and other missing features

-- First, let's add missing fields to events table
ALTER TABLE public.events 
DROP COLUMN IF EXISTS price_amount,
DROP COLUMN IF EXISTS max_attendees;

-- Make organizer_name not required (it already is nullable)

-- Add tags system for events
CREATE TABLE IF NOT EXISTS public.event_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add event tag assignments table (already exists)

-- Add promo type field for filtering
ALTER TABLE public.promos 
ADD COLUMN IF NOT EXISTS promo_type TEXT CHECK (promo_type IN ('Free Flow', 'Ladies Night', 'Bottle Promo', 'Other'));

-- Update existing promos to have a default promo type
UPDATE public.promos SET promo_type = 'Other' WHERE promo_type IS NULL;

-- Add comment tables (already exist)

-- Add user roles for admin system (already exists)

-- Create default event tags
INSERT INTO public.event_tags (name, created_by) VALUES 
  ('Nightclub', NULL),
  ('Rooftop', NULL),
  ('Live Music', NULL),
  ('Electronic', NULL),
  ('Hip Hop', NULL),
  ('Pop', NULL),
  ('House', NULL),
  ('Techno', NULL),
  ('Pool Party', NULL),
  ('Beach Club', NULL),
  ('Outdoor', NULL),
  ('Indoor', NULL),
  ('VIP', NULL),
  ('Student Night', NULL),
  ('After Work', NULL)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS on event tags
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for event tags
CREATE POLICY IF NOT EXISTS "Anyone can view event tags" 
ON public.event_tags 
FOR SELECT 
USING (true);

-- Create function to check if user is admin/superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = _user_id 
    AND role IN ('admin', 'superadmin')
  )
$$;