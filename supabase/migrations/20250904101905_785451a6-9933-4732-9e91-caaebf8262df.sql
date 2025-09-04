-- Add slug columns to events and promos tables
ALTER TABLE public.events ADD COLUMN slug TEXT;
ALTER TABLE public.promos ADD COLUMN slug TEXT;

-- Create unique indexes for slugs
CREATE UNIQUE INDEX events_slug_unique ON public.events(slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX promos_slug_unique ON public.promos(slug) WHERE slug IS NOT NULL;

-- Function to generate URL-friendly slugs
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Convert to lowercase, replace spaces and special chars with hyphens
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        lower(trim(input_text)),
        '[^a-z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get unique slug for events
CREATE OR REPLACE FUNCTION get_unique_event_slug(title_text TEXT, event_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := generate_slug(title_text);
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current event if updating)
  WHILE EXISTS (
    SELECT 1 FROM events 
    WHERE slug = final_slug 
    AND (event_id IS NULL OR id != event_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to get unique slug for promos
CREATE OR REPLACE FUNCTION get_unique_promo_slug(title_text TEXT, promo_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 1;
BEGIN
  base_slug := generate_slug(title_text);
  final_slug := base_slug;
  
  -- Check if slug exists (excluding current promo if updating)
  WHILE EXISTS (
    SELECT 1 FROM promos 
    WHERE slug = final_slug 
    AND (promo_id IS NULL OR id != promo_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Update existing events with slugs
UPDATE public.events 
SET slug = get_unique_event_slug(title, id)
WHERE slug IS NULL;

-- Update existing promos with slugs
UPDATE public.promos 
SET slug = get_unique_promo_slug(title, id)
WHERE slug IS NULL;

-- Create triggers to automatically generate slugs for new records
CREATE OR REPLACE FUNCTION update_event_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug on insert or when title changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title) THEN
    NEW.slug := get_unique_event_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_promo_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug on insert or when title changes
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.title != NEW.title) THEN
    NEW.slug := get_unique_promo_slug(NEW.title, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER events_slug_trigger
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_event_slug();

CREATE TRIGGER promos_slug_trigger
  BEFORE INSERT OR UPDATE ON public.promos
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_slug();