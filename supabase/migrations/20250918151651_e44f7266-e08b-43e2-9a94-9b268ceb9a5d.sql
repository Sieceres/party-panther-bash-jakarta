-- Drop the conflicting RLS policies on event_attendees
DROP POLICY IF EXISTS "Authenticated can select event_attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Authenticated users can view event attendees" ON public.event_attendees;
DROP POLICY IF EXISTS "Event organizers can view their event attendees" ON public.event_attendees;

-- Create a single, clear policy that allows authenticated users to view all event attendees
CREATE POLICY "Authenticated users can view event attendees" 
ON public.event_attendees 
FOR SELECT 
USING (auth.uid() IS NOT NULL);