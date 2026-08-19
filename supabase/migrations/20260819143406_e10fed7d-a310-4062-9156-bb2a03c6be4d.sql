CREATE OR REPLACE FUNCTION public.get_total_attendee_count()
RETURNS bigint
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::bigint FROM public.event_attendees;
$$;

REVOKE ALL ON FUNCTION public.get_total_attendee_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_total_attendee_count() TO anon, authenticated;