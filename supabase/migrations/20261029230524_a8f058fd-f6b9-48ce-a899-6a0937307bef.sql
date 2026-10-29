CREATE OR REPLACE FUNCTION public.venue_link_match_key(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
 SELECT regexp_replace(lower(coalesce(_name, '')), '[[:space:][:punct:]]', '', 'g')
$$;
CREATE INDEX IF NOT EXISTS venues_link_match_key_idx ON public.venues (public.venue_link_match_key(name));

CREATE OR REPLACE FUNCTION public.unique_venue_link_match(_name text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT CASE WHEN count(*) = 1 THEN (array_agg(v.id))[1] ELSE NULL END
 FROM public.venues v
 WHERE public.venue_link_match_key(_name) <> ''
 AND public.venue_link_match_key(v.name) = public.venue_link_match_key(_name)
$$;
REVOKE ALL ON FUNCTION public.unique_venue_link_match(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.auto_link_promo_venue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE matched_id uuid; v public.venues%ROWTYPE;
BEGIN
 IF NEW.venue_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.venues WHERE id = NEW.venue_id) THEN
  RETURN NEW;
 END IF;
 matched_id := public.unique_venue_link_match(NEW.venue_name);
 IF matched_id IS NOT NULL THEN
  SELECT * INTO v FROM public.venues WHERE id = matched_id;
  NEW.venue_id := v.id; NEW.venue_name := v.name;
  NEW.venue_address := v.address; NEW.area := v.area;
  NEW.venue_latitude := v.latitude; NEW.venue_longitude := v.longitude;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.auto_link_promo_venue() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER auto_link_promo_venue BEFORE INSERT OR UPDATE OF venue_id, venue_name ON public.promos FOR EACH ROW EXECUTE FUNCTION public.auto_link_promo_venue();

CREATE OR REPLACE FUNCTION public.link_promos_on_venue_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF public.unique_venue_link_match(NEW.name) = NEW.id THEN
  UPDATE public.promos p SET venue_id = NEW.id, venue_name = NEW.name,
   venue_address = NEW.address, area = NEW.area,
   venue_latitude = NEW.latitude, venue_longitude = NEW.longitude
  WHERE (p.venue_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.venues v WHERE v.id = p.venue_id))
   AND public.venue_link_match_key(p.venue_name) = public.venue_link_match_key(NEW.name);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.link_promos_on_venue_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER link_promos_on_venue_change AFTER INSERT OR UPDATE OF name ON public.venues FOR EACH ROW EXECUTE FUNCTION public.link_promos_on_venue_change();

CREATE OR REPLACE FUNCTION public.preview_promo_venue_repairs()
RETURNS TABLE (promo_id uuid, promo_title text, current_venue_name text, matched_venue_id uuid, matched_venue_name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_current_user_admin() THEN
  RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
 END IF;
 RETURN QUERY
 SELECT p.id, p.title, p.venue_name, v.id, v.name
 FROM public.promos p JOIN public.venues v ON v.id = public.unique_venue_link_match(p.venue_name)
 WHERE p.venue_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.venues linked WHERE linked.id = p.venue_id)
 ORDER BY p.id;
END $$;
REVOKE ALL ON FUNCTION public.preview_promo_venue_repairs() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_promo_venue_repairs() TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_promo_venue_repairs(_matches jsonb)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE repaired integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_current_user_admin() THEN
  RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
 END IF;
 IF _matches IS NULL OR jsonb_typeof(_matches) <> 'array' THEN
  RAISE EXCEPTION 'Expected a list of promo and venue matches' USING ERRCODE = '22023';
 END IF;
 IF jsonb_array_length(_matches) > 1000 THEN
  RAISE EXCEPTION 'At most 1000 matches per request' USING ERRCODE = '22023';
 END IF;
 IF EXISTS (SELECT 1 FROM jsonb_to_recordset(_matches) AS x(promo_id uuid, matched_venue_id uuid) WHERE x.promo_id IS NULL OR x.matched_venue_id IS NULL) THEN
  RAISE EXCEPTION 'Every match must include a promo and venue ID' USING ERRCODE = '22023';
 END IF;
 LOCK TABLE public.venues IN SHARE MODE;
 UPDATE public.promos p SET venue_id = v.id, venue_name = v.name,
  venue_address = v.address, area = v.area, venue_latitude = v.latitude, venue_longitude = v.longitude
 FROM public.venues v
 WHERE (p.venue_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.venues linked WHERE linked.id = p.venue_id))
  AND v.id = public.unique_venue_link_match(p.venue_name)
  AND EXISTS (SELECT 1 FROM jsonb_to_recordset(_matches) AS x(promo_id uuid, matched_venue_id uuid) WHERE x.promo_id = p.id AND x.matched_venue_id = v.id);
 GET DIAGNOSTICS repaired = ROW_COUNT;
 RETURN repaired;
END $$;
REVOKE ALL ON FUNCTION public.apply_promo_venue_repairs(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_promo_venue_repairs(jsonb) TO authenticated;