-- Fix critical RLS recursion issue in event_attendees table

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "Co-organizers can manage event attendees" ON public.event_attendees;

-- 2. Create a SECURITY DEFINER function to safely check co-organizer status
CREATE OR REPLACE FUNCTION public.is_event_co_organizer(event_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.event_attendees ea
    WHERE ea.event_id = event_id_param 
    AND ea.user_id = user_id_param 
    AND ea.is_co_organizer = true
  );
$$;

-- 3. Create a helper function to check if user can manage event attendees
CREATE OR REPLACE FUNCTION public.can_manage_event_attendees(event_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_id_param 
    AND (
      e.created_by = auth.uid() 
      OR public.is_event_co_organizer(event_id_param, auth.uid())
    )
  );
$$;

-- 4. Create new non-recursive policies for event_attendees
CREATE POLICY "Event creators can manage attendees"
ON public.event_attendees
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_attendees.event_id 
    AND e.created_by = auth.uid()
  )
);

CREATE POLICY "Co-organizers can manage attendees"
ON public.event_attendees
FOR ALL
USING (public.can_manage_event_attendees(event_attendees.event_id));

-- 5. Ensure users can still join and leave events
CREATE POLICY "Users can join events (fixed)"
ON public.event_attendees
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave events (fixed)" 
ON public.event_attendees
FOR DELETE
USING (auth.uid() = user_id);