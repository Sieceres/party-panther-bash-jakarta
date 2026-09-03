CREATE OR REPLACE FUNCTION public.get_event_guest_list(_event_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  is_anonymous boolean,
  is_co_organizer boolean,
  guest_count integer,
  joined_at timestamptz,
  note text,
  payment_status boolean,
  payment_claimed_at timestamptz,
  payment_date timestamptz,
  payment_marked_by uuid,
  payment_marked_by_name text,
  receipt_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = _event_id AND e.created_by = auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_attendees a WHERE a.event_id = _event_id AND a.user_id = auth.uid() AND a.is_co_organizer = true)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'superadmin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to export this guest list';
  END IF;

  RETURN QUERY
  SELECT
    a.user_id,
    COALESCE(p.display_name, 'Guest')::text,
    u.email::text,
    a.is_anonymous,
    a.is_co_organizer,
    a.guest_count,
    a.joined_at,
    a.note,
    a.payment_status,
    a.payment_claimed_at,
    a.payment_date,
    a.payment_marked_by,
    COALESCE(mp.display_name, '')::text,
    a.receipt_url
  FROM public.event_attendees a
  LEFT JOIN public.profiles p ON p.user_id = a.user_id
  LEFT JOIN auth.users u ON u.id = a.user_id
  LEFT JOIN public.profiles mp ON mp.user_id = a.payment_marked_by
  WHERE a.event_id = _event_id
  ORDER BY a.joined_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_event_guest_list(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_event_guest_list(uuid) TO authenticated;