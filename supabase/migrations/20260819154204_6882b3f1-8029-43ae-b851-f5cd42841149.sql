CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid, _is_anonymous boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _inserted boolean := false;
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

  INSERT INTO public.event_attendees (event_id, user_id, is_anonymous)
  VALUES (_event_id, _user_id, COALESCE(_is_anonymous, false))
  ON CONFLICT (event_id, user_id) DO NOTHING;

  GET DIAGNOSTICS _inserted = ROW_COUNT;
  RETURN _inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.join_event(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_event(uuid, boolean) TO authenticated;