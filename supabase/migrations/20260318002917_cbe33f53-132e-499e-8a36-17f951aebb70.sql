
-- Drop old constraint first
ALTER TABLE public.promos DROP CONSTRAINT IF EXISTS promos_promo_type_check;

-- Update existing promos
UPDATE public.promos SET promo_type = 'Beer Deal' WHERE promo_type = 'Bucket Deal';

-- Add new constraint
ALTER TABLE public.promos ADD CONSTRAINT promos_promo_type_check CHECK (promo_type = ANY (ARRAY['Happy Hour'::text, 'Ladies Night'::text, 'Free Flow'::text, 'Bottle Promo'::text, 'Beer Deal'::text, 'Other'::text]));
