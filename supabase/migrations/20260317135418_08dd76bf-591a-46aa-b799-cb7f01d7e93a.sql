
-- 1. Create flag_type enum
CREATE TYPE public.flag_type AS ENUM ('spam_reviews', 'spam_comments', 'spam_reports', 'rapid_activity');

-- 2. Create banned_users table
CREATE TABLE public.banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  banned_by uuid NOT NULL,
  reason text NOT NULL,
  banned_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view banned users" ON public.banned_users
  FOR SELECT TO authenticated USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can ban users" ON public.banned_users
  FOR INSERT TO authenticated WITH CHECK (has_admin_role(auth.uid()));

CREATE POLICY "Admins can unban users" ON public.banned_users
  FOR DELETE TO authenticated USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update bans" ON public.banned_users
  FOR UPDATE TO authenticated USING (has_admin_role(auth.uid()));

-- 3. Create is_user_banned function
CREATE OR REPLACE FUNCTION public.is_user_banned(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.banned_users
    WHERE user_id = _user_id
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 4. Create user_flags table
CREATE TABLE public.user_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flag_type public.flag_type NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view flags" ON public.user_flags
  FOR SELECT TO authenticated USING (has_admin_role(auth.uid()));

CREATE POLICY "Admins can update flags" ON public.user_flags
  FOR UPDATE TO authenticated USING (has_admin_role(auth.uid()));

CREATE POLICY "System can insert flags" ON public.user_flags
  FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Auto-flag trigger for reviews (spam_reviews)
CREATE OR REPLACE FUNCTION public.auto_flag_review_spam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
  low_rating_pct DECIMAL;
BEGIN
  -- Count reviews in last hour
  SELECT COUNT(*) INTO recent_count
  FROM public.promo_reviews
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 5 THEN
    INSERT INTO public.user_flags (user_id, flag_type, details)
    VALUES (NEW.user_id, 'spam_reviews', jsonb_build_object(
      'trigger', 'rapid_reviews',
      'count_last_hour', recent_count,
      'latest_review_id', NEW.id
    ))
    ON CONFLICT DO NOTHING;
  END IF;

  -- Check for predominantly negative reviews
  SELECT 
    CASE WHEN COUNT(*) >= 5 
      THEN COUNT(*) FILTER (WHERE rating <= 2)::DECIMAL / COUNT(*)
      ELSE 0 
    END INTO low_rating_pct
  FROM public.promo_reviews
  WHERE user_id = NEW.user_id;

  IF low_rating_pct >= 0.8 THEN
    INSERT INTO public.user_flags (user_id, flag_type, details)
    VALUES (NEW.user_id, 'spam_reviews', jsonb_build_object(
      'trigger', 'high_negative_ratio',
      'negative_pct', low_rating_pct
    ))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_flag_review_spam
  AFTER INSERT ON public.promo_reviews
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_review_spam();

-- 6. Auto-flag trigger for reports (spam_reports)
CREATE OR REPLACE FUNCTION public.auto_flag_report_spam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.reports
  WHERE reporter_id = NEW.reporter_id
    AND created_at > now() - interval '1 hour';

  IF recent_count >= 3 THEN
    INSERT INTO public.user_flags (user_id, flag_type, details)
    VALUES (NEW.reporter_id, 'spam_reports', jsonb_build_object(
      'trigger', 'rapid_reports',
      'count_last_hour', recent_count,
      'latest_report_id', NEW.id
    ))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_flag_report_spam
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_report_spam();

-- 7. Auto-flag trigger for comments (spam_comments)
CREATE OR REPLACE FUNCTION public.auto_flag_comment_spam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check event_comments + promo_comments in last 10 minutes
  SELECT (
    (SELECT COUNT(*) FROM public.event_comments WHERE user_id = NEW.user_id AND created_at > now() - interval '10 minutes') +
    (SELECT COUNT(*) FROM public.promo_comments WHERE user_id = NEW.user_id AND created_at > now() - interval '10 minutes')
  ) INTO recent_count;

  IF recent_count >= 5 THEN
    INSERT INTO public.user_flags (user_id, flag_type, details)
    VALUES (NEW.user_id, 'spam_comments', jsonb_build_object(
      'trigger', 'rapid_comments',
      'count_last_10min', recent_count
    ))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_flag_event_comment_spam
  AFTER INSERT ON public.event_comments
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_comment_spam();

CREATE TRIGGER trg_auto_flag_promo_comment_spam
  AFTER INSERT ON public.promo_comments
  FOR EACH ROW EXECUTE FUNCTION public.auto_flag_comment_spam();
