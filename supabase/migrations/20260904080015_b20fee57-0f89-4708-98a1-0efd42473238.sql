CREATE OR REPLACE FUNCTION public.is_event_participant(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_attendees ea
    WHERE ea.event_id = _event_id AND ea.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = _event_id AND e.created_by = _user_id
  )
$$;

DROP POLICY IF EXISTS "Public can view events" ON public.events;
CREATE POLICY "Public can view events"
ON public.events FOR SELECT
USING (
  access_level <> 'participants_only'::event_access_level
  OR auth.uid() = created_by
  OR public.is_current_user_admin()
  OR public.is_event_participant(id, auth.uid())
);

DROP POLICY IF EXISTS "Authenticated users can view basic event details" ON public.events;
CREATE POLICY "Authenticated users can view basic event details"
ON public.events FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    access_level <> 'participants_only'::event_access_level
    OR auth.uid() = created_by
    OR public.is_current_user_admin()
    OR public.is_event_participant(id, auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.get_events_safe()
RETURNS TABLE(id uuid, title text, description text, date date, "time" time without time zone, venue_name text, venue_address text, venue_latitude numeric, venue_longitude numeric, image_url text, price_currency text, is_recurrent boolean, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, organizer_name text, organizer_whatsapp text, slug text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.time,
    e.venue_name,
    e.venue_address,
    e.venue_latitude,
    e.venue_longitude,
    e.image_url,
    e.price_currency,
    e.is_recurrent,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.organizer_name,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN e.organizer_whatsapp
      ELSE NULL
    END as organizer_whatsapp,
    e.slug
  FROM public.events e
  WHERE
    e.access_level <> 'participants_only'::event_access_level
    OR e.created_by = auth.uid()
    OR public.is_current_user_admin()
    OR public.is_event_participant(e.id, auth.uid());
$function$;

CREATE OR REPLACE FUNCTION public.get_events_simple()
RETURNS TABLE(id uuid, title text, description text, date date, "time" time without time zone, venue_name text, venue_address text, venue_latitude numeric, venue_longitude numeric, image_url text, price_currency text, is_recurrent boolean, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, organizer_name text, organizer_whatsapp text, slug text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e."time",
    e.venue_name,
    e.venue_address,
    e.venue_latitude,
    e.venue_longitude,
    e.image_url,
    e.price_currency,
    e.is_recurrent,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.organizer_name,
    e.organizer_whatsapp,
    e.slug
  FROM public.events e
  WHERE
    e.access_level <> 'participants_only'::event_access_level
    OR e.created_by = auth.uid()
    OR public.is_current_user_admin()
    OR public.is_event_participant(e.id, auth.uid())
  ORDER BY e.date ASC, e."time" ASC;
$function$;

CREATE OR REPLACE FUNCTION public.get_events_with_details(user_id_param uuid DEFAULT NULL::uuid, p_limit integer DEFAULT NULL::integer, p_after_date date DEFAULT NULL::date, p_after_time time without time zone DEFAULT NULL::time without time zone)
RETURNS TABLE(id uuid, title text, description text, date date, "time" time without time zone, venue_name text, venue_address text, venue_latitude numeric, venue_longitude numeric, image_url text, organizer_name text, organizer_whatsapp text, price_currency text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, is_recurrent boolean, slug text, attendee_count bigint, is_joined boolean, creator_name text, creator_avatar text, creator_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.date,
    e.time,
    e.venue_name,
    e.venue_address,
    e.venue_latitude,
    e.venue_longitude,
    e.image_url,
    e.organizer_name,
    CASE 
      WHEN user_id_param IS NOT NULL THEN e.organizer_whatsapp
      ELSE NULL
    END as organizer_whatsapp,
    e.price_currency,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.is_recurrent,
    e.slug,
    COALESCE(
      eas.attendee_count::BIGINT,
      (SELECT COUNT(*) FROM event_attendees ea WHERE ea.event_id = e.id)
    ) as attendee_count,
    EXISTS(
      SELECT 1 FROM event_attendees ea 
      WHERE ea.event_id = e.id AND ea.user_id = user_id_param
    ) as is_joined,
    COALESCE(p.display_name, 'Anonymous') as creator_name,
    p.avatar_url as creator_avatar,
    COALESCE(p.is_verified, false) as creator_verified
  FROM events e
  LEFT JOIN profiles p ON e.created_by = p.user_id
  LEFT JOIN event_attendee_stats eas ON e.id = eas.event_id
  WHERE 
    (
      (p_after_date IS NULL OR e.date > p_after_date)
      OR (p_after_date IS NOT NULL AND e.date = p_after_date AND p_after_time IS NOT NULL AND e.time > p_after_time)
    )
    AND (
      e.access_level <> 'participants_only'::event_access_level
      OR e.created_by = COALESCE(user_id_param, auth.uid())
      OR public.is_current_user_admin()
      OR public.is_event_participant(e.id, COALESCE(user_id_param, auth.uid()))
    )
  ORDER BY e.date ASC, e.time ASC
  LIMIT p_limit;
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid, _is_anonymous boolean DEFAULT false, _guest_count integer DEFAULT 0)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _user_id uuid := auth.uid();
  _guests integer := LEAST(GREATEST(COALESCE(_guest_count, 0), 0), 5);
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

  IF EXISTS (
    SELECT 1 FROM public.events
    WHERE id = _event_id AND access_level = 'participants_only'::event_access_level
  ) AND NOT public.is_event_participant(_event_id, _user_id)
    AND NOT public.is_current_user_admin()
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

  RETURN true;
END;
$function$;