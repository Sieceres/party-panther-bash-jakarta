-- Add server-side input validation constraints on events and promos

-- Events constraints
ALTER TABLE public.events
ADD CONSTRAINT events_title_length CHECK (char_length(title) <= 200),
ADD CONSTRAINT events_description_length CHECK (description IS NULL OR char_length(description) <= 5000),
ADD CONSTRAINT events_valid_latitude CHECK (venue_latitude IS NULL OR (venue_latitude >= -90 AND venue_latitude <= 90)),
ADD CONSTRAINT events_valid_longitude CHECK (venue_longitude IS NULL OR (venue_longitude >= -180 AND venue_longitude <= 180)),
ADD CONSTRAINT events_venue_name_length CHECK (venue_name IS NULL OR char_length(venue_name) <= 300),
ADD CONSTRAINT events_organizer_name_length CHECK (organizer_name IS NULL OR char_length(organizer_name) <= 200);

-- Promos constraints
ALTER TABLE public.promos
ADD CONSTRAINT promos_title_length CHECK (char_length(title) <= 200),
ADD CONSTRAINT promos_description_length CHECK (char_length(description) <= 5000),
ADD CONSTRAINT promos_valid_latitude CHECK (venue_latitude IS NULL OR (venue_latitude >= -90 AND venue_latitude <= 90)),
ADD CONSTRAINT promos_valid_longitude CHECK (venue_longitude IS NULL OR (venue_longitude >= -180 AND venue_longitude <= 180)),
ADD CONSTRAINT promos_venue_name_length CHECK (char_length(venue_name) <= 300),
ADD CONSTRAINT promos_discount_text_length CHECK (char_length(discount_text) <= 500);