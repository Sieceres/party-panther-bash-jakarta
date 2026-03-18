
-- Create venue_claims table
CREATE TABLE public.venue_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venue_claims ENABLE ROW LEVEL SECURITY;

-- Users can insert their own claims
CREATE POLICY "Users can submit claims"
  ON public.venue_claims FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own claims
CREATE POLICY "Users can view own claims"
  ON public.venue_claims FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all claims
CREATE POLICY "Admins can view all claims"
  ON public.venue_claims FOR SELECT
  TO authenticated
  USING (has_admin_role(auth.uid()));

-- Admins can update claims (approve/reject)
CREATE POLICY "Admins can update claims"
  ON public.venue_claims FOR UPDATE
  TO authenticated
  USING (has_admin_role(auth.uid()));

-- Venue owners can update linked promos
CREATE POLICY "Venue owners can update linked promos"
  ON public.promos FOR UPDATE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM public.venues
      WHERE claimed_by = auth.uid() AND claim_status = 'approved'
    )
  );

-- Venue owners can delete linked promos
CREATE POLICY "Venue owners can delete linked promos"
  ON public.promos FOR DELETE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM public.venues
      WHERE claimed_by = auth.uid() AND claim_status = 'approved'
    )
  );

-- Venue owners can update linked events
CREATE POLICY "Venue owners can update linked events"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM public.venues
      WHERE claimed_by = auth.uid() AND claim_status = 'approved'
    )
  );

-- Venue owners can delete linked events
CREATE POLICY "Venue owners can delete linked events"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    venue_id IN (
      SELECT id FROM public.venues
      WHERE claimed_by = auth.uid() AND claim_status = 'approved'
    )
  );
