-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can view promo reviews" ON public.promo_reviews;

-- Create new policy allowing everyone to view reviews
CREATE POLICY "Anyone can view promo reviews"
ON public.promo_reviews
FOR SELECT
USING (true);