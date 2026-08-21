
CREATE OR REPLACE FUNCTION public.guard_attendee_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.user_id = auth.uid()
     AND NOT public.can_manage_event_attendees(NEW.event_id)
     AND NOT public.is_current_user_admin()
  THEN
    NEW.payment_status := OLD.payment_status;
    NEW.payment_date := OLD.payment_date;
    NEW.payment_marked_by := OLD.payment_marked_by;
    NEW.is_co_organizer := OLD.is_co_organizer;
    NEW.event_id := OLD.event_id;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_attendee_self_update ON public.event_attendees;
CREATE TRIGGER trg_guard_attendee_self_update
BEFORE UPDATE ON public.event_attendees
FOR EACH ROW EXECUTE FUNCTION public.guard_attendee_self_update();

DROP POLICY IF EXISTS "Attendees can update their own row" ON public.event_attendees;
CREATE POLICY "Attendees can update their own row"
ON public.event_attendees
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
