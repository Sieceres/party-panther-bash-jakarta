-- Fix security issue: Remove overly permissive public access to profiles table
-- The current "Public profiles for attendee display" policy allows unrestricted access to sensitive data

-- Drop the problematic policy that allows unrestricted public access to all profile data
DROP POLICY IF EXISTS "Public profiles for attendee display" ON public.profiles;

-- The existing security definer functions already provide proper data restriction:
-- - get_public_profile_info() only returns: id, display_name, avatar_url, bio (if authenticated), profile_type, business_name, is_verified
-- - get_safe_profile_info() only returns: id, user_id, display_name, avatar_url, is_verified, profile_type, business_name
-- - get_full_profile_info() returns full profile but only to profile owner or admins

-- The application should use these functions instead of direct table queries to ensure proper data restriction
-- The remaining policies ensure:
-- - Users can view their own full profile
-- - Admins can view all profiles
-- - Authenticated users get limited access through the existing policies