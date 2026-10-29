ALTER FUNCTION public.unique_venue_link_match(text) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.unique_venue_link_match(text) TO authenticated;
ALTER FUNCTION public.preview_promo_venue_repairs() SECURITY INVOKER;
ALTER FUNCTION public.apply_promo_venue_repairs(jsonb) SECURITY INVOKER;