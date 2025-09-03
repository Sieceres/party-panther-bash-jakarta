-- Better approach: Create RLS policies that conditionally hide sensitive data at the database level
-- This provides defense-in-depth rather than relying only on application-layer protection

-- Drop the permissive policy we just created
DROP POLICY IF EXISTS "Allow event viewing with conditional data exposure" ON public.events;

-- Create a comprehensive view that handles data exposure properly
CREATE OR REPLACE VIEW public.events_public AS
SELECT 
  id,
  title,
  description,
  date,
  time,
  venue_name,
  venue_address,
  venue_latitude,
  venue_longitude,
  image_url,
  price_currency,
  is_recurrent,
  created_by,
  created_at,
  updated_at,
  organizer_name,
  -- Hide organizer WhatsApp from public view
  NULL::text as organizer_whatsapp
FROM public.events;

-- Grant SELECT access to the public view
GRANT SELECT ON public.events_public TO authenticated, anon;

-- For the main events table, create policies that properly restrict access
-- Allow full access to authenticated users
CREATE POLICY "Authenticated users can view all event details" 
ON public.events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- For event creators, allow them to see their own events fully
CREATE POLICY "Event creators can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = created_by);

-- Create a more restrictive policy for public access that excludes sensitive fields
-- We'll handle this through the public view instead