CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid, _is_anonymous boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = _event_id) THEN
    RAISE EXCEPTION 'Event not found' USING ERRCODE = 'P0002';
  END IF;

  IF public.is_user_banned(_user_id) THEN
    RAISE EXCEPTION 'This account cannot join events' USING ERRCODE = '42501';
  END IF;

  IF public.is_removed_from_event(_event_id, _user_id) THEN
    RAISE EXCEPTION 'You have been removed from this event and cannot rejoin' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_attendees
    WHERE event_id = _event_id AND user_id = _user_id
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO public.event_attendees (event_id, user_id, is_anonymous)
  VALUES (_event_id, _user_id, COALESCE(_is_anonymous, false));

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.join_event(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_event(uuid, boolean) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';