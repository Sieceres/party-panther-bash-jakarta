-- Add co-organizer functionality to event_attendees table
ALTER TABLE public.event_attendees 
ADD COLUMN is_co_organizer BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for better performance when querying co-organizers
CREATE INDEX idx_event_attendees_co_organizer ON public.event_attendees(event_id, is_co_organizer) WHERE is_co_organizer = TRUE;

-- Update RLS policy to allow co-organizers to manage attendee data
CREATE POLICY "Co-organizers can manage event attendees" 
ON public.event_attendees 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_attendees.event_id 
    AND (
      e.created_by = auth.uid() OR 
      EXISTS (
        SELECT 1 FROM public.event_attendees ea 
        WHERE ea.event_id = e.id 
        AND ea.user_id = auth.uid() 
        AND ea.is_co_organizer = TRUE
      )
    )
  )
);

-- Update events table RLS to allow co-organizers to edit events
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;

CREATE POLICY "Event creators and co-organizers can update events" 
ON public.events 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM public.event_attendees ea 
    WHERE ea.event_id = events.id 
    AND ea.user_id = auth.uid() 
    AND ea.is_co_organizer = TRUE
  )
);

-- Update events delete policy to allow co-organizers to delete events
DROP POLICY IF EXISTS "Users can delete their own events or admins can delete any" ON public.events;

CREATE POLICY "Event creators, co-organizers and admins can delete events" 
ON public.events 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  is_current_user_admin() OR
  EXISTS (
    SELECT 1 FROM public.event_attendees ea 
    WHERE ea.event_id = events.id 
    AND ea.user_id = auth.uid() 
    AND ea.is_co_organizer = TRUE
  )
);

-- Create function to get co-organizers for an event
CREATE OR REPLACE FUNCTION public.get_event_co_organizers(event_id_param uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  is_verified boolean,
  joined_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    ea.user_id,
    COALESCE(p.display_name, 'Anonymous') as display_name,
    p.avatar_url,
    COALESCE(p.is_verified, false) as is_verified,
    ea.joined_at
  FROM public.event_attendees ea
  LEFT JOIN public.profiles p ON ea.user_id = p.user_id
  WHERE ea.event_id = event_id_param 
  AND ea.is_co_organizer = TRUE
  ORDER BY ea.joined_at ASC;
$function$;