ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz, ADD COLUMN IF NOT EXISTS last_confirmed_by uuid;

CREATE OR REPLACE FUNCTION public.confirm_promo(_promo_id uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _ok boolean; _now timestamptz := now();
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
  UPDATE public.promos SET last_confirmed_at = _now, last_confirmed_by = auth.uid() WHERE id = _promo_id;
  RETURN _now;
END $$;
REVOKE EXECUTE ON FUNCTION public.confirm_promo(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_promo(uuid) TO authenticated;