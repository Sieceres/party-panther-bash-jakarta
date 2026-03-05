
-- Create venues table
CREATE TABLE public.venues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE,
  address text,
  latitude numeric,
  longitude numeric,
  description text,
  instagram text,
  whatsapp text,
  website text,
  opening_hours text,
  image_url text,
  claimed_by uuid,
  claim_status text NOT NULL DEFAULT 'unclaimed',
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add venue_id to promos and events
ALTER TABLE public.promos ADD COLUMN venue_id uuid REFERENCES public.venues(id);
ALTER TABLE public.events ADD COLUMN venue_id uuid REFERENCES public.venues(id);

-- Generate slug trigger for venues
CREATE OR REPLACE FUNCTION public.get_unique_venue_slug(title_text text, v_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := generate_slug(title_text);
  final_slug := base_slug;
  WHILE EXISTS (
    SELECT 1 FROM venues WHERE slug = final_slug AND (v_id IS NULL OR id != v_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_venue_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.name != NEW.name) THEN
    NEW.slug := get_unique_venue_slug(NEW.name, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_venue_slug
  BEFORE INSERT OR UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.update_venue_slug();

-- Updated_at trigger for venues
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view venues"
  ON public.venues FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage venues"
  ON public.venues FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Authenticated users can create venues"
  ON public.venues FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Venue owners can update their claimed venue"
  ON public.venues FOR UPDATE
  USING (auth.uid() = claimed_by AND claim_status = 'approved');
