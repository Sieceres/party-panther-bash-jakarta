CREATE OR REPLACE FUNCTION public.get_event_for_invite_code(_identifier text, _code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _event_id uuid;
  _result json;
BEGIN
  -- Find the event by custom slug, slug, or id
  SELECT id INTO _event_id
  FROM public.events
  WHERE (custom_slug IS NOT NULL AND custom_slug = lower(_identifier))
     OR (slug IS NOT NULL AND slug = _identifier)
     OR (id::text = _identifier)
  LIMIT 1;

  IF _event_id IS NULL THEN
    RETURN null;
  END IF;

  -- Validate the invite code for this event
  IF NOT EXISTS (
    SELECT 1 FROM public.event_invite_codes
    WHERE event_id = _event_id
      AND code = upper(_code)
      AND is_revoked = false
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        invited_user_email IS NULL
        OR lower(invited_user_email) = lower(COALESCE((auth.jwt() ->> 'email')::text, ''))
      )
  ) THEN
    RETURN null;
  END IF;

  SELECT json_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'date', e.date,
    'time', e.time,
    'venue_name', e.venue_name,
    'venue_address', e.venue_address,
    'venue_latitude', e.venue_latitude,
    'venue_longitude', e.venue_longitude,
    'image_url', e.image_url,
    'is_recurrent', e.is_recurrent,
    'track_payments', e.track_payments,
    'organizer_name', e.organizer_name,
    'created_by', e.created_by,
    'created_at', e.created_at,
    'updated_at', e.updated_at,
    'instagram_post_url', e.instagram_post_url,
    'slug', e.slug,
    'access_level', e.access_level,
    'max_attendees', e.max_attendees,
    'enable_check_in', e.enable_check_in,
    'enable_photos', e.enable_photos,
    'venue_id', e.venue_id,
    'custom_slug', e.custom_slug,
    'custom_slug_expires_at', e.custom_slug_expires_at
  ) INTO _result
  FROM public.events e
  WHERE e.id = _event_id;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_for_invite_code(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.join_event(
  _event_id uuid,
  _is_anonymous boolean DEFAULT false,
  _guest_count integer DEFAULT 0,
  _invite_code text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _guests integer := LEAST(GREATEST(COALESCE(_guest_count, 0), 0), 5);
  _code_valid boolean := false;
  _code_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = _event_id) THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF public.is_user_banned(_user_id) THEN
    RAISE EXCEPTION 'User is banned';
  END IF;

  IF public.is_removed_from_event(_event_id, _user_id) THEN
    RAISE EXCEPTION 'You cannot rejoin this event';
  END IF;

  -- Validate invite code if provided
  IF _invite_code IS NOT NULL AND length(trim(_invite_code)) > 0 THEN
    SELECT id INTO _code_id
    FROM public.event_invite_codes
    WHERE event_id = _event_id
      AND code = upper(trim(_invite_code))
      AND is_revoked = false
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now())
      AND (
        invited_user_email IS NULL
        OR lower(invited_user_email) = lower(COALESCE((auth.jwt() ->> 'email')::text, ''))
      );

    IF FOUND THEN
      _code_valid := true;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND access_level = 'participants_only'::event_access_level
  ) AND NOT public.is_event_participant(_event_id, _user_id)
    AND NOT public.is_current_user_admin()
    AND NOT _code_valid
  THEN
    RAISE EXCEPTION 'This event is only open to existing participants';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.event_attendees
    WHERE event_id = _event_id AND user_id = _user_id
  ) THEN
    RETURN true;
  END IF;

  INSERT INTO public.event_attendees (event_id, user_id, is_anonymous, guest_count)
  VALUES (_event_id, _user_id, COALESCE(_is_anonymous, false), _guests);

  -- Mark invite code as used now that the user has successfully joined
  IF _code_valid THEN
    UPDATE public.event_invite_codes
    SET used_by = _user_id,
        used_at = now()
    WHERE id = _code_id;
  END IF;

  RETURN true;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.join_event(uuid, boolean, integer, text) TO anon, authenticated, service_role;