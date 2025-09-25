-- Fix security warnings from previous migration

-- Update functions to have proper search_path settings
CREATE OR REPLACE FUNCTION public.is_event_co_organizer(event_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.event_attendees ea
    WHERE ea.event_id = event_id_param 
    AND ea.user_id = user_id_param 
    AND ea.is_co_organizer = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_event_attendees(event_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
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