CREATE OR REPLACE FUNCTION public.notify_payment_claimed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  v_event_title text;
  v_event_slug text;
  v_owner uuid;
  v_name text;
  v_link text;
  v_kind text;
  v_title text;
  v_message text;
  v_sent_count integer;
  v_recent boolean;
  r record;
BEGIN
  IF OLD.payment_claimed_at IS NULL AND NEW.payment_claimed_at IS NOT NULL THEN
    v_kind := 'payment_claimed';
  ELSIF (OLD.receipt_url IS NULL OR OLD.receipt_url = '') AND COALESCE(NEW.receipt_url, '') <> '' THEN
    v_kind := 'payment_receipt';
  ELSE
    RETURN NEW;
  END IF;

  SELECT created_by, title, slug INTO v_owner, v_event_title, v_event_slug
  FROM public.events WHERE id = NEW.event_id;

  SELECT COALESCE(display_name, 'Someone') INTO v_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Anti-spam: max 3 notifications of this kind per attendee per event, and
  -- none if one was already created in the last 30 minutes.
  SELECT COUNT(*) INTO v_sent_count
  FROM public.user_notifications n
  WHERE n.type = v_kind
    AND n.metadata->>'event_id' = NEW.event_id::text
    AND n.metadata->>'attendee_user_id' = NEW.user_id::text;

  IF v_sent_count >= 3 THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_notifications n
    WHERE n.type = v_kind
      AND n.metadata->>'event_id' = NEW.event_id::text
      AND n.metadata->>'attendee_user_id' = NEW.user_id::text
      AND n.created_at > now() - interval '30 minutes'
  ) INTO v_recent;

  IF v_recent THEN
    RETURN NEW;
  END IF;

  v_link := '/event/' || COALESCE(v_event_slug, NEW.event_id::text);

  IF v_kind = 'payment_claimed' THEN
    v_title := 'Attendee marked as paid';
    v_message := COALESCE(v_name, 'Someone') || ' marked payment as paid for "' || COALESCE(v_event_title, 'your event') || '"';
  ELSE
    v_title := 'Payment receipt uploaded';
    v_message := COALESCE(v_name, 'Someone') || ' uploaded a payment receipt for "' || COALESCE(v_event_title, 'your event') || '"';
  END IF;

  FOR r IN
    SELECT DISTINCT uid FROM (
      SELECT v_owner AS uid
      UNION
      SELECT ea.user_id FROM public.event_attendees ea
      WHERE ea.event_id = NEW.event_id AND ea.is_co_organizer = true
    ) s
    WHERE s.uid IS NOT NULL AND s.uid <> NEW.user_id
  LOOP
    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      r.uid,
      v_kind,
      v_title,
      v_message,
      v_link,
      jsonb_build_object('event_id', NEW.event_id, 'attendee_user_id', NEW.user_id)
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_payment_claimed ON public.event_attendees;
CREATE TRIGGER trg_notify_payment_claimed
  AFTER UPDATE ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_payment_claimed();