CREATE OR REPLACE FUNCTION public.submit_event_registration(_event_id uuid, _name text, _email text, _answers jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ev record; _count int; _id uuid; _f jsonb; _v jsonb; _text text; _empty boolean;
BEGIN
 SELECT id,title,slug,created_by,registration_enabled,registration_fields,registration_capacity,date,time INTO _ev FROM public.events WHERE id=_event_id;
 IF _ev.id IS NULL OR NOT _ev.registration_enabled THEN RAISE EXCEPTION 'Registration is not open for this event'; END IF;
 IF (_ev.date + _ev.time) < (now() AT TIME ZONE 'Asia/Jakarta') THEN RAISE EXCEPTION 'This event has already started'; END IF;
 IF _answers IS NULL OR jsonb_typeof(_answers)<>'object' THEN _answers:='{}'::jsonb; END IF;
 IF length(_answers::text)>20000 THEN RAISE EXCEPTION 'Answers are too long'; END IF;
 _name:=NULL; _email:=NULL;
 FOR _f IN SELECT * FROM jsonb_array_elements(_ev.registration_fields) LOOP
  _v:=_answers->(_f->>'id'); _text:=btrim(coalesce(_answers->>(_f->>'id'),''));
  _empty:=_v IS NULL OR _v='null'::jsonb OR _text='' OR _v='[]'::jsonb;
  IF coalesce((_f->>'required')::boolean,false) AND _empty THEN RAISE EXCEPTION 'Please answer "%"',_f->>'label'; END IF;
  IF NOT _empty THEN
   IF _f->>'type'='multi_choice' THEN
    IF jsonb_typeof(_v)<>'array' THEN RAISE EXCEPTION 'Invalid choices for "%"',_f->>'label'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(_v) choice WHERE NOT coalesce((_f->'options') @> jsonb_build_array(choice),false)) THEN RAISE EXCEPTION 'Invalid choices for "%"',_f->>'label'; END IF;
   ELSE
    IF jsonb_typeof(_v)<>'string' OR length(_text)>2000 THEN RAISE EXCEPTION 'Invalid answer for "%"',_f->>'label'; END IF;
    IF _f->>'type'='single_choice' AND NOT coalesce((_f->'options') ? _text,false) THEN RAISE EXCEPTION 'Invalid choice for "%"',_f->>'label'; END IF;
    IF _f->>'type'='email' AND (length(_text)>255 OR _text !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') THEN RAISE EXCEPTION 'Please enter a valid email'; END IF;
    IF _f->>'type'='phone' AND _text !~ '^[+0-9 ()-]{6,20}$' THEN RAISE EXCEPTION 'Please enter a valid phone number'; END IF;
   END IF;
  END IF;
  IF _f->>'contact'='name' THEN _name:=nullif(_text,''); END IF;
  IF _f->>'contact'='email' THEN _email:=nullif(lower(_text),''); END IF;
 END LOOP;
 IF length(_name)>120 THEN RAISE EXCEPTION 'Name is too long'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(_event_id::text));
 SELECT count(*) INTO _count FROM public.event_registrations WHERE event_id=_event_id;
 IF _ev.registration_capacity IS NOT NULL AND _count>=_ev.registration_capacity THEN RAISE EXCEPTION 'Registration is full'; END IF;
 IF _email IS NOT NULL AND EXISTS (SELECT 1 FROM public.event_registrations WHERE event_id=_event_id AND lower(respondent_email)=_email) THEN RAISE EXCEPTION 'This email is already registered for this event'; END IF;
 INSERT INTO public.event_registrations(event_id,user_id,respondent_name,respondent_email,answers) VALUES(_event_id,auth.uid(),_name,_email,_answers) RETURNING id INTO _id;
 IF _ev.created_by IS NOT NULL THEN
 INSERT INTO public.user_notifications(user_id,type,title,message,link,metadata) VALUES(_ev.created_by,'event_registration','New registration',coalesce(_name,'Someone')||' registered for "'||coalesce(_ev.title,'your event')||'"','/event/'||coalesce(_ev.slug,_event_id::text),jsonb_build_object('event_id',_event_id,'registration_id',_id));
 END IF;
 RETURN _id;
END $$;
REVOKE ALL ON FUNCTION public.submit_event_registration(uuid,text,text,jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_event_registration(uuid,text,text,jsonb) TO anon,authenticated;