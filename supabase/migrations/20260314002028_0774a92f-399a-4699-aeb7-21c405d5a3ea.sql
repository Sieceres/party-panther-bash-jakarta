
-- Table to store venue edit proposals and history
CREATE TABLE public.venue_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL,
  
  -- Status: pending (user suggestion), approved, rejected, direct (admin direct edit)
  status text NOT NULL DEFAULT 'pending',
  
  -- The proposed changes as JSONB (field_name -> new_value)
  changes jsonb NOT NULL DEFAULT '{}',
  
  -- Previous values for history (populated on approval or direct edit)
  previous_values jsonb DEFAULT '{}',
  
  -- Admin who reviewed
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_note text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.venue_edits ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit edits
CREATE POLICY "Authenticated users can submit venue edits"
  ON public.venue_edits FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Users can view their own edits
CREATE POLICY "Users can view own venue edits"
  ON public.venue_edits FOR SELECT TO authenticated
  USING (auth.uid() = submitted_by);

-- Admins can view all edits
CREATE POLICY "Admins can view all venue edits"
  ON public.venue_edits FOR SELECT TO authenticated
  USING (is_current_user_admin());

-- Admins can update edits (approve/reject)
CREATE POLICY "Admins can update venue edits"
  ON public.venue_edits FOR UPDATE TO authenticated
  USING (is_current_user_admin());

-- Admins can delete edits
CREATE POLICY "Admins can delete venue edits"
  ON public.venue_edits FOR DELETE TO authenticated
  USING (is_current_user_admin());

-- Index for fast lookups
CREATE INDEX idx_venue_edits_venue_id ON public.venue_edits(venue_id);
CREATE INDEX idx_venue_edits_status ON public.venue_edits(status);
