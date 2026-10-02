CREATE TABLE public.kam_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kam_id uuid NOT NULL,
  action text NOT NULL,
  promo_id uuid,
  venue_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX kam_activity_kam_created_idx ON public.kam_activity (kam_id, created_at DESC);
GRANT SELECT ON public.kam_activity TO authenticated;
GRANT ALL ON public.kam_activity TO service_role;
ALTER TABLE public.kam_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view all KAM activity" ON public.kam_activity FOR SELECT TO authenticated USING (public.is_current_user_admin());
CREATE POLICY "KAMs view own activity" ON public.kam_activity FOR SELECT TO authenticated USING (kam_id = auth.uid());

CREATE OR REPLACE FUNCTION public.confirm_promo(_promo_id uuid)
 RETURNS timestamp with time zone
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _ok boolean; _now timestamptz := now(); _venue uuid; _title text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  SELECT public.is_current_user_admin() OR EXISTS (
    SELECT 1 FROM public.promos p
    JOIN public.venues v ON v.id = p.venue_id
      OR (p.venue_id IS NULL AND public.normalize_venue_name(v.name) = public.normalize_venue_name(p.venue_name))
    JOIN public.user_roles r ON r.user_id = auth.uid() AND r.role = 'kam'
    WHERE p.id = _promo_id AND v.kam_id = auth.uid()
  ) INTO _ok;
  IF NOT _ok THEN RAISE EXCEPTION 'Only the venue''s KAM can confirm this promo'; END IF;
  UPDATE public.promos SET last_confirmed_at = _now, last_confirmed_by = auth.uid() WHERE id = _promo_id
    RETURNING venue_id, title INTO _venue, _title;
  INSERT INTO public.kam_activity (kam_id, action, promo_id, venue_id, details)
    VALUES (auth.uid(), 'confirm_promo', _promo_id, _venue, jsonb_build_object('title', _title));
  RETURN _now;
END $function$;