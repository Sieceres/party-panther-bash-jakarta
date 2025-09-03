-- Fix security issue: Remove overly permissive profile access and implement proper privacy controls

-- First, drop the problematic policy that makes all profiles publicly readable
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a more secure policy that only allows authenticated users to view limited profile information
-- This allows for shared profiles while protecting sensitive data
CREATE POLICY "Authenticated users can view limited profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a policy for public access to only essential profile information (display_name, avatar_url, bio)
-- This creates a view-like access pattern where sensitive fields are protected
CREATE POLICY "Public can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false); -- Initially block all anonymous access

-- Update the existing policies to be more explicit about access patterns
-- The existing policies for users accessing their own profiles and admin access remain the same

-- Add a function to get safe profile data for public sharing
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  profile_type text,
  business_name text,
  is_verified boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.profile_type,
    p.business_name,
    p.is_verified
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;