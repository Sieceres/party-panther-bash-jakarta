-- Fix 1: Refresh the materialized view to get current counts
REFRESH MATERIALIZED VIEW CONCURRENTLY event_attendee_stats;

-- Fix 2: Update NULL display names with a default based on user_id
UPDATE profiles 
SET display_name = 'User ' || SUBSTRING(user_id::text, 1, 8)
WHERE display_name IS NULL;

-- Fix 3: Modify the handle_new_user function to always set a display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id, 
    COALESCE(
      NEW.raw_user_meta_data ->> 'display_name',
      NEW.raw_user_meta_data ->> 'full_name',
      'User ' || SUBSTRING(NEW.id::text, 1, 8)
    )
  );
  RETURN NEW;
END;
$function$;