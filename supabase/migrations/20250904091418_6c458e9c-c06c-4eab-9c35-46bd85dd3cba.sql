-- Fix critical security issue: Remove overly permissive profile access policies
-- and implement proper RLS policies for user data protection

-- First, drop the problematic policies that allow too broad access
DROP POLICY IF EXISTS "Authenticated users can view limited profile info" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

-- Create a secure policy that only allows viewing of minimal public profile info
-- This is needed for legitimate use cases like showing event/promo creators
CREATE POLICY "Public can view minimal profile info for creators" 
ON public.profiles 
FOR SELECT 
USING (true)
-- This will be restricted by a security definer function that only returns safe fields
;

-- Create a security definer function to safely expose only minimal profile info
CREATE OR REPLACE FUNCTION public.get_safe_profile_info(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  is_verified boolean,
  profile_type text,
  business_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.is_verified,
    p.profile_type,
    p.business_name
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;

-- Update the existing public profile function to be more secure
CREATE OR REPLACE FUNCTION public.get_public_profile_info(profile_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text, profile_type text, business_name text, is_verified boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    -- Only show bio if user is authenticated
    CASE 
      WHEN auth.uid() IS NOT NULL THEN p.bio
      ELSE NULL
    END as bio,
    p.profile_type,
    p.business_name,
    p.is_verified
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
$$;

-- Create a function to get full profile details (only for the owner or admins)
CREATE OR REPLACE FUNCTION public.get_full_profile_info(profile_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  profile_type text,
  business_name text,
  is_verified boolean,
  age integer,
  gender text,
  whatsapp text,
  instagram text,
  party_style text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.profile_type,
    p.business_name,
    p.is_verified,
    p.age,
    p.gender,
    p.whatsapp,
    p.instagram,
    p.party_style,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.user_id = profile_user_id
  AND (
    -- User can see their own full profile
    auth.uid() = profile_user_id 
    OR 
    -- Admins can see any profile
    (p.user_id IN (
      SELECT user_id FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND (is_admin = true OR is_super_admin = true)
    ))
  );
$$;

-- Remove the overly broad policy and replace with restrictive one
DROP POLICY IF EXISTS "Public can view minimal profile info for creators" ON public.profiles;

-- Create a very restrictive policy - direct table access should be minimal
CREATE POLICY "Restrict direct profile table access"
ON public.profiles
FOR SELECT
USING (
  -- Only allow direct access to own profile or by admins
  auth.uid() = user_id 
  OR 
  auth.uid() = id
  OR
  (
    SELECT (is_admin OR is_super_admin) 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- Add comment to document the security approach
COMMENT ON FUNCTION public.get_safe_profile_info IS 'Returns minimal safe profile information that can be publicly accessed';
COMMENT ON FUNCTION public.get_public_profile_info IS 'Returns limited profile information for public viewing with some auth-gated fields';
COMMENT ON FUNCTION public.get_full_profile_info IS 'Returns complete profile information only to profile owner or admins';