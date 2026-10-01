REVOKE EXECUTE ON FUNCTION public.guard_venue_kam_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_venue_kam(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_venue_kam(uuid) TO authenticated;