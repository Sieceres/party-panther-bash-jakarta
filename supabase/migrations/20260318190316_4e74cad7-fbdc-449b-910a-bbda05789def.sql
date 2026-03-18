-- Create missing instagram_oembed_cache table

CREATE TABLE public.instagram_oembed_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_url TEXT NOT NULL UNIQUE,
  oembed_html TEXT NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE public.instagram_oembed_cache ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions) should access this table
-- No public/authenticated access needed

CREATE INDEX idx_instagram_oembed_cache_url ON public.instagram_oembed_cache(instagram_url);
CREATE INDEX idx_instagram_oembed_cache_expires ON public.instagram_oembed_cache(expires_at);