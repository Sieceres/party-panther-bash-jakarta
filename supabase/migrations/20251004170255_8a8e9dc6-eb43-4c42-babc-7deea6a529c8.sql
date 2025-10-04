-- Allow everyone to view basic public profile information
CREATE POLICY "Public can view basic profile info"
ON public.profiles
FOR SELECT
USING (true);