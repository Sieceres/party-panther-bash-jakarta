ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS kam_id uuid, ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;
CREATE INDEX IF NOT EXISTS venues_kam_id_idx ON public.venues(kam_id);

CREATE OR REPLACE FUNCTION public.is_venue_kam(_venue_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _venue_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.venues v
    JOIN public.user_roles r ON r.user_id = v.kam_id AND r.role = 'kam'
    WHERE v.id = _venue_id AND v.kam_id = auth.uid()
  )
$$;

-- Prevent KAMs from reassigning venues (only admins may change kam_id)
CREATE OR REPLACE FUNCTION public.guard_venue_kam_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.kam_id IS DISTINCT FROM OLD.kam_id AND NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can change the venue manager';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_venue_kam_change ON public.venues;
CREATE TRIGGER guard_venue_kam_change BEFORE UPDATE ON public.venues
FOR EACH ROW EXECUTE FUNCTION public.guard_venue_kam_change();

CREATE POLICY "KAMs can update their venues" ON public.venues FOR UPDATE TO authenticated
  USING (public.is_venue_kam(id)) WITH CHECK (public.is_venue_kam(id));

CREATE POLICY "KAMs can update promos at their venues" ON public.promos FOR UPDATE TO authenticated
  USING (public.is_venue_kam(venue_id));
CREATE POLICY "KAMs can delete promos at their venues" ON public.promos FOR DELETE TO authenticated
  USING (public.is_venue_kam(venue_id));
CREATE POLICY "KAMs can update events at their venues" ON public.events FOR UPDATE TO authenticated
  USING (public.is_venue_kam(venue_id));
CREATE POLICY "KAMs can delete events at their venues" ON public.events FOR DELETE TO authenticated
  USING (public.is_venue_kam(venue_id));