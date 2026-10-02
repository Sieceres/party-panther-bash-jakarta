CREATE OR REPLACE FUNCTION public.normalize_venue_name(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT btrim(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(_name,'')), '[^a-z0-9\s]', '', 'g'), '^\s*the\s+', ''), '\s+', ' ', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.find_venue_by_name(_name text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.venues
  WHERE public.normalize_venue_name(name) = public.normalize_venue_name(_name)
  ORDER BY created_at ASC LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.find_venue_by_name(text) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.prevent_duplicate_venue()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.normalize_venue_name(NEW.name) = '' THEN
    RETURN NEW;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.id <> NEW.id
      AND public.normalize_venue_name(v.name) = public.normalize_venue_name(NEW.name)
  ) THEN
    RAISE EXCEPTION 'A venue named "%" already exists', NEW.name USING ERRCODE = '23505';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS prevent_duplicate_venue ON public.venues;
CREATE TRIGGER prevent_duplicate_venue
BEFORE INSERT ON public.venues
FOR EACH ROW EXECUTE FUNCTION public.prevent_duplicate_venue();