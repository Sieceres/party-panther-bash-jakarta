-- Create a security definer function to check if user can update event
CREATE OR REPLACE FUNCTION public.can_user_update_event(event_id_param uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id_param 
    AND (
      e.created_by = auth.uid() 
      OR public.is_current_user_admin()
      OR public.is_event_co_organizer(event_id_param, auth.uid())
    )
  );
$$;

-- Drop the existing policy that causes recursion
DROP POLICY IF EXISTS "Event creators and co-organizers can update events" ON public.events;

-- Create new policy using the security definer function
CREATE POLICY "Event creators and co-organizers can update events"
ON public.events
FOR UPDATE
USING (public.can_user_update_event(id));