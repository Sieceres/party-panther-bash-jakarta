CREATE OR REPLACE FUNCTION public.get_public_profiles(_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, bio text, is_verified boolean, profile_type text, business_name text, venue_status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.bio, p.is_verified, p.profile_type, p.business_name, p.venue_status
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
$$;

REVOKE ALL ON FUNCTION public.get_public_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO anon, authenticated, service_role;