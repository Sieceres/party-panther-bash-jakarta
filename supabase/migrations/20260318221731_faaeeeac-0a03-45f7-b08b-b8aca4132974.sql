
-- ==========================================
-- Phase 1: user_notifications table + triggers
-- ==========================================

-- 1. Create user_notifications table
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_user_notifications_user_unread ON public.user_notifications (user_id, is_read, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can view own notifications"
  ON public.user_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON public.user_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service-role / triggers insert (no INSERT policy for anon/authenticated needed since triggers use SECURITY DEFINER)

-- 2. Trigger: venue_claims status change → notify claimant
CREATE OR REPLACE FUNCTION public.notify_claim_result()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  venue_name_val text;
  venue_slug_val text;
BEGIN
  -- Only fire when status changes from pending to approved/rejected
  IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
    SELECT name, slug INTO venue_name_val, venue_slug_val
    FROM public.venues WHERE id = NEW.venue_id;

    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.user_id,
      'claim_result',
      CASE NEW.status
        WHEN 'approved' THEN 'Venue claim approved! 🎉'
        WHEN 'rejected' THEN 'Venue claim update'
      END,
      CASE NEW.status
        WHEN 'approved' THEN 'Your claim for "' || COALESCE(venue_name_val, 'Unknown Venue') || '" has been approved. You can now manage this venue.'
        WHEN 'rejected' THEN 'Your claim for "' || COALESCE(venue_name_val, 'Unknown Venue') || '" was not approved.' || CASE WHEN NEW.review_note IS NOT NULL THEN ' Reason: ' || NEW.review_note ELSE '' END
      END,
      '/venue/' || COALESCE(venue_slug_val, NEW.venue_id::text),
      jsonb_build_object('venue_id', NEW.venue_id, 'status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_claim_result
  AFTER UPDATE ON public.venue_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_claim_result();

-- 3. Trigger: new promo review → notify promo creator
CREATE OR REPLACE FUNCTION public.notify_new_review()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  promo_owner uuid;
  promo_title text;
  promo_slug text;
BEGIN
  -- Look up promo owner (try by UUID first, then by slug)
  IF NEW.promo_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    SELECT created_by, title, slug INTO promo_owner, promo_title, promo_slug
    FROM public.promos WHERE id = NEW.promo_id::uuid;
  ELSE
    SELECT created_by, title, slug INTO promo_owner, promo_title, promo_slug
    FROM public.promos WHERE slug = NEW.promo_id;
  END IF;

  -- Don't notify yourself
  IF promo_owner IS NOT NULL AND promo_owner != NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      promo_owner,
      'new_review',
      'New ' || NEW.rating || '★ review',
      'Someone reviewed your promo "' || COALESCE(promo_title, 'Unknown') || '"' || CASE WHEN NEW.comment IS NOT NULL THEN ': "' || LEFT(NEW.comment, 100) || '"' ELSE '' END,
      '/promo/' || COALESCE(promo_slug, NEW.promo_id),
      jsonb_build_object('promo_id', NEW.promo_id, 'review_id', NEW.id, 'rating', NEW.rating)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_review
  AFTER INSERT ON public.promo_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_review();

-- 4. Trigger: someone joins event → notify event creator
CREATE OR REPLACE FUNCTION public.notify_event_join()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  event_owner uuid;
  event_title text;
  event_slug text;
  joiner_name text;
BEGIN
  SELECT created_by, title, slug INTO event_owner, event_title, event_slug
  FROM public.events WHERE id = NEW.event_id;

  SELECT COALESCE(display_name, 'Someone') INTO joiner_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Don't notify yourself
  IF event_owner IS NOT NULL AND event_owner != NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      event_owner,
      'event_join',
      'New attendee joined!',
      joiner_name || ' joined your event "' || COALESCE(event_title, 'Unknown') || '"',
      '/event/' || COALESCE(event_slug, NEW.event_id::text),
      jsonb_build_object('event_id', NEW.event_id, 'joiner_user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_join
  AFTER INSERT ON public.event_attendees
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_join();

-- 5. Trigger: comment on event → notify event creator
CREATE OR REPLACE FUNCTION public.notify_event_comment()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  event_owner uuid;
  event_title text;
  event_slug text;
  commenter_name text;
BEGIN
  SELECT created_by, title, slug INTO event_owner, event_title, event_slug
  FROM public.events WHERE id = NEW.event_id;

  SELECT COALESCE(display_name, 'Someone') INTO commenter_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Don't notify yourself
  IF event_owner IS NOT NULL AND event_owner != NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      event_owner,
      'event_comment',
      'New comment on your event',
      commenter_name || ' commented on "' || COALESCE(event_title, 'Unknown') || '": "' || LEFT(NEW.comment, 100) || '"',
      '/event/' || COALESCE(event_slug, NEW.event_id::text),
      jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_event_comment
  AFTER INSERT ON public.event_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_comment();

-- ==========================================
-- Phase 2: Anonymous reviews + Review replies
-- ==========================================

-- 6. Add is_anonymous column to promo_reviews
ALTER TABLE public.promo_reviews ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;

-- 7. Create review_replies table
CREATE TABLE public.review_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.promo_reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT one_reply_per_review UNIQUE (review_id)
);

ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can view replies
CREATE POLICY "Anyone can view review replies"
  ON public.review_replies FOR SELECT
  USING (true);

-- Venue owners can insert replies on reviews of their promos
CREATE POLICY "Venue owners can reply to reviews"
  ON public.review_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM public.promo_reviews pr
      JOIN public.promos p ON (
        CASE
          WHEN pr.promo_id ~ '^[0-9a-fA-F]{8}-' THEN p.id = pr.promo_id::uuid
          ELSE p.slug = pr.promo_id
        END
      )
      JOIN public.venues v ON p.venue_id = v.id
      WHERE pr.id = review_replies.review_id
        AND v.claimed_by = auth.uid()
        AND v.claim_status = 'approved'
    )
  );

-- Venue owners can update their own replies
CREATE POLICY "Venue owners can update their replies"
  ON public.review_replies FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Venue owners can delete their own replies
CREATE POLICY "Venue owners can delete their replies"
  ON public.review_replies FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 8. Trigger: review reply → notify reviewer
CREATE OR REPLACE FUNCTION public.notify_review_reply()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
DECLARE
  reviewer_id uuid;
  promo_title text;
  promo_slug text;
  replier_name text;
BEGIN
  -- Get the reviewer and promo info
  SELECT pr.user_id, COALESCE(p.title, 'Unknown'), COALESCE(p.slug, pr.promo_id)
  INTO reviewer_id, promo_title, promo_slug
  FROM public.promo_reviews pr
  LEFT JOIN public.promos p ON (
    CASE
      WHEN pr.promo_id ~ '^[0-9a-fA-F]{8}-' THEN p.id = pr.promo_id::uuid
      ELSE p.slug = pr.promo_id
    END
  )
  WHERE pr.id = NEW.review_id;

  SELECT COALESCE(display_name, 'Venue Owner') INTO replier_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Don't notify yourself
  IF reviewer_id IS NOT NULL AND reviewer_id != NEW.user_id THEN
    INSERT INTO public.user_notifications (user_id, type, title, message, link, metadata)
    VALUES (
      reviewer_id,
      'review_reply',
      'Reply to your review',
      replier_name || ' replied to your review on "' || promo_title || '": "' || LEFT(NEW.comment, 100) || '"',
      '/promo/' || promo_slug,
      jsonb_build_object('review_id', NEW.review_id, 'reply_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_review_reply
  AFTER INSERT ON public.review_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_review_reply();
