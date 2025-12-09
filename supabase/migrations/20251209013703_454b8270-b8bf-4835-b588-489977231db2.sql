-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can view basic profile info only" ON public.profiles;

-- Create a new policy that requires authentication for viewing profiles
-- Users should use the get_public_profile_info RPC function for safe access
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);