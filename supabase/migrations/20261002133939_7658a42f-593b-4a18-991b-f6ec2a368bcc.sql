ALTER FUNCTION public.find_venue_by_name(text) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.prevent_duplicate_venue() FROM PUBLIC, anon, authenticated;