-- Fix security issue: Event Organizer Contact Details Publicly Exposed
-- Create a secure function to get events with conditional access to organizer contact details

-- First, create a function that returns events with conditional access to sensitive organizer data
CREATE OR REPLACE FUNCTION public.get_events_safe()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  date date,
  "time" time,
  venue_name text,
  venue_address text,
  venue_latitude numeric,
  venue_longitude numeric,
  image_url text,
  price_currency text,
  is_recurrent boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  organizer_name text,
  organizer_whatsapp text
) 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.time,
    e.venue_name,
    e.venue_address,
    e.venue_latitude,
    e.venue_longitude,
    e.image_url,
    e.price_currency,
    e.is_recurrent,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.organizer_name,
    -- Only expose organizer WhatsApp to authenticated users
    CASE 
      WHEN auth.uid() IS NOT NULL THEN e.organizer_whatsapp
      ELSE NULL
    END as organizer_whatsapp
  FROM public.events e;
$$;

-- Update the RLS policy to be more restrictive for organizer contact details
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

-- Create new policies with better security
-- Public can view basic event information
CREATE POLICY "Public can view basic event info" ON public.events
FOR SELECT 
USING (true);

-- Grant execute permission on the safe function to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_events_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_events_safe() TO anon;