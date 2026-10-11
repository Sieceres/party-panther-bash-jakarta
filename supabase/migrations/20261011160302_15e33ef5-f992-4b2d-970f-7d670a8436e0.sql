ALTER TABLE public.events
  ADD COLUMN registration_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN registration_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN registration_capacity integer;

CREATE TABLE public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid,
  respondent_name text,
  respondent_email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_registrations_event_idx ON public.event_registrations (event_id, created_at DESC);
CREATE UNIQUE INDEX event_registrations_event_email_uniq ON public.event_registrations (event_id, lower(respondent_email)) WHERE respondent_email IS NOT NULL;

GRANT SELECT, DELETE ON public.event_registrations TO authenticated;
GRANT ALL ON public.event_registrations TO service_role;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers and admins view registrations" ON public.event_registrations
  FOR SELECT TO authenticated
  USING (public.can_manage_event_attendees(event_id) OR public.is_current_user_admin() OR user_id = auth.uid());
CREATE POLICY "Organizers and admins delete registrations" ON public.event_registrations
  FOR DELETE TO authenticated
  USING (public.can_manage_event_attendees(event_id) OR public.is_current_user_admin());

CREATE OR REPLACE FUNCTION public.get_event_registration_count(_event_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT count(*)::int FROM public.event_registrations WHERE event_id = _event_id $$;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_event_registration(_event_id uuid, _name text, _email text, _answers jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _ev record; _count int; _id uuid; _f jsonb; _v jsonb;
BEGIN
  SELECT id, title, slug, created_by, registration_enabled, registration_fields, registration_capacity, date, time
    INTO _ev FROM public.events WHERE id = _event_id;
  IF _ev.id IS NULL OR NOT _ev.registration_enabled THEN RAISE EXCEPTION 'Registration is not open for this event'; END IF;
  IF (_ev.date + _ev.time) < (now() AT TIME ZONE 'Asia/Jakarta') THEN RAISE EXCEPTION 'This event has already started'; END IF;

  _name := nullif(btrim(coalesce(_name, '')), '');
  _email := nullif(lower(btrim(coalesce(_email, ''))), '');
  IF _name IS NULL OR length(_name) > 120 THEN RAISE EXCEPTION 'Please enter your name'; END IF;
  IF _email IS NULL OR length(_email) > 255 OR _email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN RAISE EXCEPTION 'Please enter a valid email'; END IF;
  IF _answers IS NULL OR jsonb_typeof(_answers) <> 'object' THEN _answers := '{}'::jsonb; END IF;
  IF length(_answers::text) > 20000 THEN RAISE EXCEPTION 'Answers are too long'; END IF;

  -- required fields
  FOR _f IN SELECT * FROM jsonb_array_elements(_ev.registration_fields) LOOP
    IF coalesce((_f->>'required')::boolean, false) THEN
      _v := _answers -> (_f->>'id');
      IF _v IS NULL OR _v = 'null'::jsonb OR _v = '""'::jsonb OR _v = '[]'::jsonb THEN
        RAISE EXCEPTION 'Please answer "%"', _f->>'label';
      END IF;
    END IF;
  END LOOP;

  PERFORM pg_advisory_xact_lock(hashtext(_event_id::text));
  SELECT count(*) INTO _count FROM public.event_registrations WHERE event_id = _event_id;
  IF _ev.registration_capacity IS NOT NULL AND _count >= _ev.registration_capacity THEN
    RAISE EXCEPTION 'Registration is full';
  END IF;
  IF EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id = _event_id AND lower(respondent_email) = _email) THEN
    RAISE EXCEPTION 'This email is already registered for this event';
  END IF;

  INSERT INTO public.event_registrations (event_id, user_id, respondent_name, respondent_email, answers)
  VALUES (_event_id, auth.uid(), _name, _email, _answers) RETURNING id INTO _id;

  IF _ev.created_by IS NOT NULL THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (_ev.created_by, 'event_registration', 'New registration',
      _name || ' registered for "' || coalesce(_ev.title, 'your event') || '"',
      '/event/' || coalesce(_ev.slug, _event_id::text),
      jsonb_build_object('event_id', _event_id, 'registration_id', _id));
  END IF;
  RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.submit_event_registration(uuid, text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_event_registration(uuid, text, text, jsonb) TO anon, authenticated;