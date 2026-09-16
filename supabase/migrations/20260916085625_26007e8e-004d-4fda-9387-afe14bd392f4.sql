ALTER TABLE public.promos ADD COLUMN IF NOT EXISTS promo_types text[];
UPDATE public.promos SET promo_types = ARRAY[promo_type] WHERE promo_types IS NULL AND promo_type IS NOT NULL;