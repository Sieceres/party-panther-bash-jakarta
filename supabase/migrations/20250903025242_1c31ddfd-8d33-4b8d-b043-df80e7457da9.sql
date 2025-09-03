-- Fix search path for the newly created function and any remaining functions
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

-- Update the remaining functions with proper search paths
CREATE OR REPLACE FUNCTION public.get_my_claim(claim text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb -> claim
$$;

CREATE OR REPLACE FUNCTION public.check_review_fraud()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  negative_count INTEGER;
  total_count INTEGER;
  fraud_threshold DECIMAL := 0.8; -- 80% negative reviews
BEGIN
  -- Count user's reviews
  SELECT 
    COUNT(*) FILTER (WHERE rating <= 2),
    COUNT(*)
  INTO negative_count, total_count
  FROM public.promo_reviews 
  WHERE user_id = NEW.user_id;
  
  -- If user has more than 5 reviews and 80%+ are negative, flag as potential fraud
  IF total_count >= 5 AND (negative_count::DECIMAL / total_count) >= fraud_threshold THEN
    -- Log this for admin review (you could create a fraud_alerts table)
    RAISE WARNING 'Potential review fraud detected for user %, negative reviews: %/%', 
      NEW.user_id, negative_count, total_count;
  END IF;
  
  RETURN NEW;
END;
$$;