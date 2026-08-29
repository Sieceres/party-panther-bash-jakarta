ALTER TABLE public.event_attendees
  ADD COLUMN IF NOT EXISTS guest_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.event_attendees
  DROP CONSTRAINT IF EXISTS event_attendees_guest_count_range;
ALTER TABLE public.event_attendees
  ADD CONSTRAINT event_attendees_guest_count_range CHECK (guest_count >= 0 AND guest_count <= 5);

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

DROP FUNCTION IF EXISTS public.get_event_attendees(uuid);
CREATE OR REPLACE FUNCTION public.get_event_attendees(_event_id uuid)
 RETURNS TABLE(id uuid, event_id uuid, user_id uuid, joined_at timestamp with time zone, payment_status boolean, payment_date timestamp with time zone, payment_marked_by uuid, payment_claimed_at timestamp with time zone, receipt_url text, receipt_uploaded_at timestamp with time zone, note text, is_anonymous boolean, is_co_organizer boolean, guest_count integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ea.id, ea.event_id, ea.user_id, ea.joined_at,
    CASE WHEN priv.ok THEN ea.payment_status ELSE false END,
    CASE WHEN priv.ok THEN ea.payment_date ELSE NULL END,
    CASE WHEN priv.ok THEN ea.payment_marked_by ELSE NULL END,
    CASE WHEN priv.ok THEN ea.payment_claimed_at ELSE NULL END,
    CASE WHEN priv.ok THEN ea.receipt_url ELSE NULL END,
    CASE WHEN priv.ok THEN ea.receipt_uploaded_at ELSE NULL END,
    CASE WHEN priv.ok THEN ea.note ELSE NULL END,
    ea.is_anonymous,
    ea.is_co_organizer,
    ea.guest_count
  FROM public.event_attendees ea
  CROSS JOIN LATERAL (
    SELECT (
      ea.user_id = auth.uid()
      OR public.can_manage_event_attendees(_event_id)
      OR public.is_current_user_admin()
    ) AS ok
  ) priv
  WHERE ea.event_id = _event_id
  ORDER BY ea.joined_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.get_event_attendee_counts()
 RETURNS TABLE(event_id uuid, attendee_count bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ea.event_id, SUM(1 + COALESCE(ea.guest_count, 0))::bigint AS attendee_count
  FROM public.event_attendees ea
  GROUP BY ea.event_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_total_attendee_count()
 RETURNS bigint
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(1 + COALESCE(guest_count, 0)), 0)::bigint FROM public.event_attendees;
$function$;