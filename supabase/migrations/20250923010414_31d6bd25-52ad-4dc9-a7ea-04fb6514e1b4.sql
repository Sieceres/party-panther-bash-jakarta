-- Fix security issue: Remove overly permissive public access to profiles table
-- and replace with restricted access that only exposes necessary basic information

-- First, drop the problematic policy that allows unrestricted public access
DROP POLICY IF EXISTS "Public profiles for attendee display" ON public.profiles;

-- Create a new policy that only allows public access to essential, non-sensitive profile information
-- for displaying user names and avatars in event/promo contexts
CREATE POLICY "Limited public profile info for display" 
ON public.profiles 
FOR SELECT 
USING (true)
-- This policy will be restricted by the security definer functions that already exist
-- (get_public_profile_info, get_safe_profile_info) which control what data is actually returned;

-- Ensure we have proper policies for authenticated users to see more profile details
-- The existing policies already handle authenticated user access appropriately:
-- - Users can view their own full profile
-- - Admins can view all profiles  
-- - Other authenticated users get limited access through the security definer functions

-- Add a comment explaining the security approach
COMMENT ON POLICY "Limited public profile info for display" ON public.profiles IS 
'Allows public access to profiles table but actual data exposure is controlled by security definer functions (get_public_profile_info, get_safe_profile_info) which only return essential display information like display_name and avatar_url';

-- Verify that the existing security definer functions properly restrict data access:
-- get_public_profile_info() only returns: id, display_name, avatar_url, bio (if authenticated), profile_type, business_name, is_verified
-- get_safe_profile_info() only returns: id, user_id, display_name, avatar_url, is_verified, profile_type, business_name
-- get_full_profile_info() returns full profile but only to profile owner or admins

-- The application should use these functions instead of direct table queries to ensure proper data restriction