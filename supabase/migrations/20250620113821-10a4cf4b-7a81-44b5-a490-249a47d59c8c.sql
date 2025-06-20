-- Remove foreign key constraints temporarily for sample data
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE public.promos DROP CONSTRAINT IF EXISTS promos_created_by_fkey;

-- Clear existing sample data if any
DELETE FROM public.promo_reviews WHERE promo_id IN (SELECT id::text FROM public.promos WHERE title IN ('50% Off Premium Cocktails', 'Free Entry Before 10PM', 'Ladies Night Special'));
DELETE FROM public.events WHERE title IN ('Electronic Night: Jakarta Vibes', 'Friday Night Fever', 'Rooftop Sunset Party');
DELETE FROM public.promos WHERE title IN ('50% Off Premium Cocktails', 'Free Entry Before 10PM', 'Ladies Night Special');

-- Insert sample events
INSERT INTO public.events (
  title, 
  description, 
  date, 
  time, 
  venue_name, 
  venue_address, 
  venue_latitude, 
  venue_longitude, 
  price_amount, 
  max_attendees, 
  organizer_name, 
  organizer_whatsapp, 
  image_url, 
  created_by
) VALUES 
(
  'Electronic Night: Jakarta Vibes',
  'Experience the best electronic music in Jakarta with top DJs and amazing light shows. Dance the night away with premium sound quality.',
  '2025-06-20',
  '22:00:00',
  'Sky Bar Kemang',
  'Jl. Kemang Raya No. 3A, Jakarta Selatan',
  -6.2615,
  106.8106,
  200000,
  150,
  'Jakarta Nights Events',
  '+6281234567890',
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop',
  gen_random_uuid()
),
(
  'Friday Night Fever',
  'Join us for an unforgettable Friday night with the hottest beats and premium cocktails in the heart of SCBD.',
  '2025-06-21',
  '21:00:00',
  'District 8 Lounge',
  'District 8, SCBD, Jakarta Selatan',
  -6.2297,
  106.8230,
  150000,
  120,
  'Party Central',
  '+6281234567891',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
  gen_random_uuid()
),
(
  'Rooftop Sunset Party',
  'Watch the sunset while enjoying premium cocktails and great music on Jakarta''s most exclusive rooftop venue.',
  '2025-06-22',
  '18:00:00',
  'Potato Head Senayan',
  'Senayan City, Jakarta Selatan',
  -6.2297,
  106.8071,
  300000,
  80,
  'Elite Events Jakarta',
  '+6281234567892',
  'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop',
  gen_random_uuid()
);

-- Insert sample promos
INSERT INTO public.promos (
  title,
  description,
  discount_text,
  venue_name,
  venue_address,
  venue_latitude,
  venue_longitude,
  category,
  original_price_amount,
  discounted_price_amount,
  valid_until,
  day_of_week,
  area,
  drink_type,
  image_url,
  created_by
) VALUES
(
  '50% Off Premium Cocktails',
  'Get 50% off all premium cocktails during happy hour! The perfect way to start your night with friends.',
  '50% OFF',
  'The Jungle Bar',
  'Jl. Senopati No. 64, Jakarta Selatan',
  -6.2297,
  106.8230,
  'Drinks',
  200000,
  100000,
  '2025-12-31',
  'Friday',
  'South Jakarta',
  'Cocktails',
  'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=300&fit=crop',
  gen_random_uuid()
),
(
  'Free Entry Before 10PM',
  'Skip the cover charge when you arrive before 10PM. Early birds get the best spots and save money!',
  'FREE ENTRY',
  'Zodiac Club',
  'Jl. Gatot Subroto, Jakarta Selatan',
  -6.2088,
  106.8456,
  'Entry',
  150000,
  0,
  '2025-12-31',
  'Saturday',
  'Central Jakarta',
  'All',
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
  gen_random_uuid()
),
(
  'Ladies Night Special',
  'Free drinks for ladies all night long every Wednesday! Come with your friends and enjoy the best cocktails in town.',
  '100% OFF DRINKS',
  'Immigrant Club',
  'Jl. Kemang Raya No. 57, Jakarta Selatan',
  -6.2615,
  106.8106,
  'Ladies Night',
  250000,
  0,
  '2025-12-31',
  'Wednesday',
  'South Jakarta',
  'All',
  'https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop',
  gen_random_uuid()
);

-- Insert sample reviews for the promos to test ratings
INSERT INTO public.promo_reviews (promo_id, user_id, rating, comment) VALUES
((SELECT id::text FROM public.promos WHERE title = '50% Off Premium Cocktails'), gen_random_uuid(), 5, 'Amazing cocktails and great atmosphere!'),
((SELECT id::text FROM public.promos WHERE title = '50% Off Premium Cocktails'), gen_random_uuid(), 4, 'Good deal, will come back again.'),
((SELECT id::text FROM public.promos WHERE title = 'Free Entry Before 10PM'), gen_random_uuid(), 5, 'Great way to save money and still have fun!'),
((SELECT id::text FROM public.promos WHERE title = 'Ladies Night Special'), gen_random_uuid(), 4, 'Fun night with friends, free drinks were great!');