-- Create function to get public attendee counts for all events
CREATE OR REPLACE FUNCTION public.get_event_attendee_counts()
RETURNS TABLE(event_id uuid, attendee_count bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    ea.event_id,
    COUNT(*) as attendee_count
  FROM public.event_attendees ea
  GROUP BY ea.event_id;
$$;