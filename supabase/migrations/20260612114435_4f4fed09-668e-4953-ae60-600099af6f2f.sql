
CREATE TABLE public.pending_scraped_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_url text,
  item_type text NOT NULL CHECK (item_type IN ('event','promo')),
  raw_data jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','duplicate')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pending_scraped_items TO authenticated;
GRANT ALL ON public.pending_scraped_items TO service_role;

ALTER TABLE public.pending_scraped_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage scraped items"
ON public.pending_scraped_items
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

CREATE INDEX pending_scraped_items_status_idx ON public.pending_scraped_items(status, created_at DESC);
