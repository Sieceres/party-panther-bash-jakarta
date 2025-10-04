-- Create function to automatically set promo_id_uuid
CREATE OR REPLACE FUNCTION public.set_promo_id_uuid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If promo_id is a valid UUID, copy it to promo_id_uuid
  IF NEW.promo_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    NEW.promo_id_uuid := NEW.promo_id::uuid;
  ELSE
    -- If it's a slug, look up the UUID from promos table
    SELECT id INTO NEW.promo_id_uuid 
    FROM public.promos 
    WHERE slug = NEW.promo_id 
    LIMIT 1;
    
    -- If found, also update promo_id to be the UUID
    IF NEW.promo_id_uuid IS NOT NULL THEN
      NEW.promo_id := NEW.promo_id_uuid::text;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on insert or update
DROP TRIGGER IF EXISTS set_promo_id_uuid_trigger ON public.promo_reviews;
CREATE TRIGGER set_promo_id_uuid_trigger
  BEFORE INSERT OR UPDATE ON public.promo_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_promo_id_uuid();