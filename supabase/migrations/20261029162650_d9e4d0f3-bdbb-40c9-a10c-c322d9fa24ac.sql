ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS booking_url text;
GRANT SELECT (booking_url) ON public.venues TO anon, authenticated;
GRANT UPDATE (booking_url) ON public.venues TO authenticated;