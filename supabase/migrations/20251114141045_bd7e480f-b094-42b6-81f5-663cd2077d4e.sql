-- Create enum for event access levels
CREATE TYPE public.event_access_level AS ENUM ('public', 'private', 'invite_only', 'secret');

-- Add new columns to events table
ALTER TABLE public.events
ADD COLUMN access_level public.event_access_level DEFAULT 'public' NOT NULL,
ADD COLUMN max_attendees INTEGER,
ADD COLUMN enable_check_in BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN enable_photos BOOLEAN DEFAULT false NOT NULL;

-- Create event_check_ins table
CREATE TABLE public.event_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  checked_in_by UUID NOT NULL,
  UNIQUE(event_id, user_id)
);

ALTER TABLE public.event_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees can view check-ins for their events"
  ON public.event_check_ins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_attendees
    WHERE event_id = event_check_ins.event_id
    AND user_id = auth.uid()
  ));

CREATE POLICY "Attendees can check themselves in"
  ON public.event_check_ins FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND auth.uid() = checked_in_by
    AND EXISTS (
      SELECT 1 FROM public.event_attendees
      WHERE event_id = event_check_ins.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can check in attendees"
  ON public.event_check_ins FOR INSERT
  WITH CHECK (
    auth.uid() = checked_in_by
    AND can_manage_event_attendees(event_id)
  );

-- Create event_photos table
CREATE TABLE public.event_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL,
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_hidden BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-hidden photos"
  ON public.event_photos FOR SELECT
  USING (NOT is_hidden);

CREATE POLICY "Attendees can upload photos"
  ON public.event_photos FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND EXISTS (
      SELECT 1 FROM public.event_attendees
      WHERE event_id = event_photos.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own photos"
  ON public.event_photos FOR DELETE
  USING (auth.uid() = uploaded_by);

CREATE POLICY "Organizers can delete any photo"
  ON public.event_photos FOR DELETE
  USING (can_manage_event_attendees(event_id));

CREATE POLICY "Organizers can update photos"
  ON public.event_photos FOR UPDATE
  USING (can_manage_event_attendees(event_id));

-- Create event_photo_reports table
CREATE TABLE public.event_photo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id UUID NOT NULL REFERENCES public.event_photos(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reason TEXT NOT NULL,
  reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(photo_id, reported_by)
);

ALTER TABLE public.event_photo_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can report photos"
  ON public.event_photo_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Users can view their own reports"
  ON public.event_photo_reports FOR SELECT
  USING (auth.uid() = reported_by);

CREATE POLICY "Organizers can view all reports for their events"
  ON public.event_photo_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_photos ep
    WHERE ep.id = event_photo_reports.photo_id
    AND can_manage_event_attendees(ep.event_id)
  ));

-- Create function to auto-hide photos with 2+ reports
CREATE OR REPLACE FUNCTION public.auto_hide_reported_photos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO report_count
  FROM public.event_photo_reports
  WHERE photo_id = NEW.photo_id;
  
  IF report_count >= 2 THEN
    UPDATE public.event_photos
    SET is_hidden = true
    WHERE id = NEW.photo_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_hide_reported_photos
AFTER INSERT ON public.event_photo_reports
FOR EACH ROW
EXECUTE FUNCTION public.auto_hide_reported_photos();

-- Create event_invite_codes table
CREATE TABLE public.event_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  invited_user_email TEXT,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  is_revoked BOOLEAN DEFAULT false NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.event_invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view valid codes"
  ON public.event_invite_codes FOR SELECT
  USING (NOT is_revoked AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Organizers can manage invite codes"
  ON public.event_invite_codes FOR ALL
  USING (can_manage_event_attendees(event_id))
  WITH CHECK (
    auth.uid() = created_by
    AND can_manage_event_attendees(event_id)
  );

-- Create index for performance
CREATE INDEX idx_event_check_ins_event_id ON public.event_check_ins(event_id);
CREATE INDEX idx_event_photos_event_id ON public.event_photos(event_id);
CREATE INDEX idx_event_photo_reports_photo_id ON public.event_photo_reports(photo_id);
CREATE INDEX idx_event_invite_codes_code ON public.event_invite_codes(code);
CREATE INDEX idx_event_invite_codes_event_id ON public.event_invite_codes(event_id);