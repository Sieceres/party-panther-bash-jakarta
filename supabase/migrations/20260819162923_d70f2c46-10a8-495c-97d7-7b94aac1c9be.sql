CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid, _is_anonymous boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.events
    WHERE id = _event_id
  ) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF public.is_user_banned(_user_id) THEN
    RAISE EXCEPTION 'User is banned';
  END IF;

  IF public.is_removed_from_event(_event_id, _user_id) THEN
    RAISE EXCEPTION 'You cannot rejoin this event';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.event_attendees
    WHERE event_id = _event_id
      AND user_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  INSERT INTO public.event_attendees (event_id, user_id, is_anonymous)
  VALUES (_event_id, _user_id, COALESCE(_is_anonymous, false));

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.join_event(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_event(uuid, boolean) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';