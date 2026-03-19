
-- Check if table exists first
CREATE TABLE IF NOT EXISTS public.removed_event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  removed_by uuid NOT NULL,
  removed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.removed_event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for the removal tracking table
CREATE POLICY "Event managers can insert removal records"
ON public.removed_event_attendees FOR INSERT
TO authenticated
WITH CHECK (can_manage_event_attendees(event_id));

CREATE POLICY "Event managers can view removals"
ON public.removed_event_attendees FOR SELECT
TO authenticated
USING (can_manage_event_attendees(event_id) OR auth.uid() = user_id);

-- Function to check removal status
CREATE OR REPLACE FUNCTION public.is_removed_from_event(_event_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.removed_event_attendees
    WHERE event_id = _event_id AND user_id = _user_id
  );
$$;
