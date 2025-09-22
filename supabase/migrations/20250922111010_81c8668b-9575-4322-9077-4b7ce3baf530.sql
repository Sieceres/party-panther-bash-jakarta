-- Enable RLS on all tables that might not have it enabled
-- This ensures proper security for attendee list visibility

-- Check and enable RLS on key tables
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorite_promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Ensure event_attendees can be viewed by all authenticated users
-- (This policy should already exist, but let's make sure it's correct)
DROP POLICY IF EXISTS "Authenticated users can view event attendees" ON public.event_attendees;
CREATE POLICY "Authenticated users can view event attendees" 
ON public.event_attendees 
FOR SELECT 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Also ensure profiles can be viewed appropriately for attendee list display
DROP POLICY IF EXISTS "Public profiles for attendee display" ON public.profiles;
CREATE POLICY "Public profiles for attendee display" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);