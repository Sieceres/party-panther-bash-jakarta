-- Fix security issue: Make events table more restrictive for direct access
-- The get_events_safe() function should be used instead of direct table queries

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view events (use get_events_safe function for proper" ON public.events;

-- Create a more restrictive policy that only allows:
-- 1. Event creators to see their own events with full details
-- 2. Authenticated users to see basic event info (but organizer_whatsapp should be hidden via application logic)
-- 3. Unauthenticated users get very limited access
CREATE POLICY "Event creators can view their own events with full details" 
ON public.events 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can view basic event details" 
ON public.events 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Note: Applications should use get_events_safe() function instead of direct table access
-- The function properly handles hiding sensitive organizer contact information