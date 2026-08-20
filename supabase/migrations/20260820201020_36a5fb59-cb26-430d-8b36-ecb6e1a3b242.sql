GRANT SELECT ON public.pending_scraped_items TO anon;
GRANT SELECT ON public.pending_scraped_items TO authenticated;
CREATE POLICY "Anyone can view scraped items" ON public.pending_scraped_items FOR SELECT TO anon, authenticated USING (true);