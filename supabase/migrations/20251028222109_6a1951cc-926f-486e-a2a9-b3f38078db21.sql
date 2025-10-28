-- Add indexes for frequently queried columns to improve performance

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);

-- Promos table indexes
CREATE INDEX IF NOT EXISTS idx_promos_created_at ON public.promos(created_at);
CREATE INDEX IF NOT EXISTS idx_promos_created_by ON public.promos(created_by);
CREATE INDEX IF NOT EXISTS idx_promos_slug ON public.promos(slug);
CREATE INDEX IF NOT EXISTS idx_promos_valid_until ON public.promos(valid_until);
CREATE INDEX IF NOT EXISTS idx_promos_category ON public.promos(category);
CREATE INDEX IF NOT EXISTS idx_promos_area ON public.promos(area);

-- Event attendees indexes
CREATE INDEX IF NOT EXISTS idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON public.event_attendees(user_id);

-- Promo reviews indexes
CREATE INDEX IF NOT EXISTS idx_promo_reviews_promo_id_uuid ON public.promo_reviews(promo_id_uuid);
CREATE INDEX IF NOT EXISTS idx_promo_reviews_user_id ON public.promo_reviews(user_id);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_user_favorite_promos_user_id ON public.user_favorite_promos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_promos_promo_id ON public.user_favorite_promos(promo_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments(event_id);
CREATE INDEX IF NOT EXISTS idx_promo_comments_promo_id ON public.promo_comments(promo_id);