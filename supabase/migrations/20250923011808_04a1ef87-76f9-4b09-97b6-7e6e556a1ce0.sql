-- Update profile visibility for authenticated users
-- Make WhatsApp, Instagram, age, gender, business names visible to all logged-in members

-- Update the get_public_profile_info function to include personal info for authenticated users
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text, profile_type text, business_name text, is_verified boolean, age integer, gender text, whatsapp text, instagram text)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    -- Show bio to authenticated users
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.bio
      ELSE NULL
    END as bio,
    p.profile_type,
    p.business_name,
    p.is_verified,
    -- Show personal info to authenticated users
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.age
      ELSE NULL
    END as age,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.gender
      ELSE NULL
    END as gender,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.whatsapp
      ELSE NULL
    END as whatsapp,
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.instagram
      ELSE NULL
    END as instagram
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$function$;

-- Add RLS policy to allow authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles" ON public.profiles
FOR SELECT USING (auth.uid() IS NOT NULL);