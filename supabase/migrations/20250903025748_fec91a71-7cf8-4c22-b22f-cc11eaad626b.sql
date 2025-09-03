-- Fix the relationship issue between event_comments and profiles
-- The issue is that event_comments.user_id and profiles.user_id both reference auth.users
-- but there's no direct relationship defined between the tables

-- Add a foreign key constraint to establish the relationship
-- This will allow Supabase to understand how to join these tables
ALTER TABLE public.event_comments 
ADD CONSTRAINT fk_event_comments_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Also fix the same issue for promo_comments if it exists
ALTER TABLE public.promo_comments 
ADD CONSTRAINT fk_promo_comments_profiles 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);

-- Update the profiles table to ensure user_id is unique (required for foreign key)
-- This should already be the case, but let's make it explicit
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_user_id UNIQUE (user_id);