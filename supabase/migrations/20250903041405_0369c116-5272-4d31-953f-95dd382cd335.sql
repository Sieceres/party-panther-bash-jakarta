-- Fix security issue: Restrict event_attendees SELECT access to authenticated users only
-- This prevents public access to sensitive attendance data

-- Drop the current overly permissive policy
DROP POLICY IF EXISTS "Users can view event attendees" ON public.event_attendees;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view event attendees" 
ON public.event_attendees 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Optional: Add a more restrictive policy for event organizers to see their own event attendees
CREATE POLICY "Event organizers can view their event attendees" 
ON public.event_attendees 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.events e 
    WHERE e.id = event_attendees.event_id 
    AND e.created_by = auth.uid()
  )
);