-- Update promos table to support multiple values for days and drink types
-- First handle day_of_week column
ALTER TABLE public.promos 
ALTER COLUMN day_of_week TYPE text[] USING CASE 
  WHEN day_of_week IS NULL OR day_of_week = '' THEN NULL 
  ELSE ARRAY[day_of_week] 
END;

-- Then handle drink_type column  
ALTER TABLE public.promos 
ALTER COLUMN drink_type TYPE text[] USING CASE 
  WHEN drink_type IS NULL OR drink_type = '' THEN NULL 
  ELSE ARRAY[drink_type] 
END;