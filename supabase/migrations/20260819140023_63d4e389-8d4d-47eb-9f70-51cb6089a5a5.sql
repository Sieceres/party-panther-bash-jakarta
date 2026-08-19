ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS custom_slug text,
  ADD COLUMN IF NOT EXISTS custom_slug_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS events_custom_slug_active_idx
  ON public.events (lower(custom_slug))
  WHERE custom_slug IS NOT NULL;

CREATE OR REPLACE FUNCTION public.is_reserved_slug(_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(_slug) IN (
    'admin','auth','api','app','about','contact','events','event','promos','promo',
    'venue','venues','map','profile','profiles','login','logout','signup','register',
    'privacy','terms','terms-conditions','import','voucher','vouchers','reset-password',
    'e','p','v','ee','ep','wc','wce','esc','lexium','lintang','instagram-generator',
    'sitemap','robots','static','assets','public','null','undefined','new','edit','search'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_custom_slug_available(_slug text, _event_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _slug ~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$'
    AND NOT public.is_reserved_slug(_slug)
    AND NOT EXISTS (
      SELECT 1 FROM public.events e
      WHERE lower(e.custom_slug) = lower(_slug)
        AND (_event_id IS NULL OR e.id <> _event_id)
        AND (e.custom_slug_expires_at IS NULL OR e.custom_slug_expires_at > now())
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.events e WHERE e.slug = _slug AND (_event_id IS NULL OR e.id <> _event_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.claim_event_custom_slug(_event_id uuid, _slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_clean text;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = _event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF NOT (
    v_event.created_by = auth.uid()
    OR public.is_current_user_admin()
    OR public.is_event_co_organizer(_event_id, auth.uid())
  ) THEN
    RAISE EXCEPTION 'Not allowed to set a custom link for this event';
  END IF;

  IF _slug IS NULL OR btrim(_slug) = '' THEN
    UPDATE public.events
      SET custom_slug = NULL, custom_slug_expires_at = NULL
      WHERE id = _event_id;
    RETURN NULL;
  END IF;

  v_clean := lower(btrim(_slug));

  IF v_clean !~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$' THEN
    RAISE EXCEPTION 'Link must be 3-40 characters: lowercase letters, numbers and hyphens';
  END IF;

  IF NOT public.is_custom_slug_available(v_clean, _event_id) THEN
    RAISE EXCEPTION 'That link is not available';
  END IF;

  -- free any expired holder of the same link
  UPDATE public.events
    SET custom_slug = NULL, custom_slug_expires_at = NULL
    WHERE lower(custom_slug) = v_clean
      AND id <> _event_id
      AND custom_slug_expires_at IS NOT NULL
      AND custom_slug_expires_at <= now();

  UPDATE public.events
    SET custom_slug = v_clean,
        custom_slug_expires_at = (COALESCE(v_event.date, current_date) + interval '30 days')
    WHERE id = _event_id;

  RETURN v_clean;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_custom_slug_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.custom_slug IS NOT NULL AND (NEW.date IS DISTINCT FROM OLD.date) THEN
    NEW.custom_slug_expires_at := NEW.date + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_custom_slug_expiry ON public.events;
CREATE TRIGGER trg_refresh_custom_slug_expiry
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.refresh_custom_slug_expiry();

GRANT EXECUTE ON FUNCTION public.is_custom_slug_available(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_event_custom_slug(uuid, text) TO authenticated;