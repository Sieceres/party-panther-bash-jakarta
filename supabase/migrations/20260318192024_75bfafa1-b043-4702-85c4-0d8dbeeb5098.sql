
-- Fix 1: Add SET search_path to get_promos_with_details(p_slug text) which is missing it
CREATE OR REPLACE FUNCTION public.get_promos_with_details(p_slug text)
 RETURNS TABLE(id uuid, slug text, title text, description text, image_url text, original_price_amount integer, discounted_price_amount integer, price_currency text, promo_type text, created_by uuid, created_at timestamp with time zone, updated_at timestamp with time zone, review_count bigint, review_avg numeric)
 LANGUAGE sql
 STABLE
 SECURITY INVOKER
 SET search_path = 'public'
AS $function$
SELECT
  p.id,
  p.slug,
  p.title,
  p.description,
  p.image_url,
  p.original_price_amount,
  p.discounted_price_amount,
  p.price_currency,
  p.promo_type,
  p.created_by,
  p.created_at,
  p.updated_at,
  COALESCE(r.total_reviews,0) AS review_count,
  COALESCE(r.avg_rating,0)::numeric AS review_avg
FROM public.promos p
LEFT JOIN public.promo_review_stats r ON p.id = r.promo_id
WHERE p.slug = p_slug;
$function$;

-- Fix 2: Tighten profiles INSERT policy from WITH CHECK (true) to proper ownership check
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Enable insert for authenticated users only"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Fix 3: Tighten user_flags INSERT policy - only allow system/trigger inserts via the user's own ID
-- Triggers use SECURITY DEFINER and bypass RLS, so this policy only affects direct client calls
DROP POLICY IF EXISTS "System can insert flags" ON public.user_flags;
CREATE POLICY "System can insert flags"
ON public.user_flags FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
