-- Fix security vulnerability: Restrict promo reviews and comments to authenticated users only
-- This prevents tracking of user behavior by unauthenticated visitors

-- Update promo_reviews SELECT policy to require authentication
DROP POLICY IF EXISTS "Anyone can view promo reviews" ON public.promo_reviews;
CREATE POLICY "Authenticated users can view promo reviews" 
ON public.promo_reviews 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update promo_comments SELECT policy to require authentication  
DROP POLICY IF EXISTS "Anyone can view promo comments" ON public.promo_comments;
CREATE POLICY "Authenticated users can view promo comments"
ON public.promo_comments
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Update event_comments SELECT policy to require authentication (consistency)
DROP POLICY IF EXISTS "Only logged in users can view event comments" ON public.event_comments;
CREATE POLICY "Authenticated users can view event comments"
ON public.event_comments
FOR SELECT
USING (auth.uid() IS NOT NULL);