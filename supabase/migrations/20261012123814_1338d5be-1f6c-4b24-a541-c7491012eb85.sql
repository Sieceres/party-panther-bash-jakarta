ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS fields_snapshot jsonb;

UPDATE public.event_registrations r
SET fields_snapshot = e.registration_fields
FROM public.events e
WHERE e.id = r.event_id AND r.fields_snapshot IS NULL;

CREATE OR REPLACE FUNCTION public.snapshot_registration_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT registration_fields INTO NEW.fields_snapshot FROM public.events WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_registration_fields ON public.event_registrations;
CREATE TRIGGER trg_snapshot_registration_fields
BEFORE INSERT ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.snapshot_registration_fields();