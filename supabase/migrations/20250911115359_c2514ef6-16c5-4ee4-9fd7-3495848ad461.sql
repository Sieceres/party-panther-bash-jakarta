-- Update promos table to support multiple values
-- Change day_of_week and drink_type to support arrays or comma-separated values
ALTER TABLE public.promos 
ALTER COLUMN day_of_week TYPE text[],
ALTER COLUMN drink_type TYPE text[];

-- Update existing data to arrays (convert single values to arrays)
UPDATE public.promos 
SET day_of_week = ARRAY[day_of_week] 
WHERE day_of_week IS NOT NULL AND day_of_week != '';

UPDATE public.promos 
SET drink_type = ARRAY[drink_type] 
WHERE drink_type IS NOT NULL AND drink_type != '';