-- Geocode remaining venues with coordinates from web research
-- Aubree: Agora Mall, Thamrin, Central Jakarta
UPDATE venues SET latitude = -6.1928, longitude = 106.8222, address = 'Agora Mall, Jl. M.H. Thamrin, Central Jakarta' WHERE id = 'b8ec7531-fb0b-4782-a32f-9bc03d3f6f80';

-- Cantinero: Gunawarman, South Jakarta
UPDATE venues SET latitude = -6.2340, longitude = 106.7990, address = 'Jl. Gunawarman, Senopati, South Jakarta' WHERE id = '12d9ddfd-94cc-4719-b4fc-47980dc14afe';

-- Casalena: Jl. Hang Lekir 2 No.30, Kebayoran Baru, South Jakarta
UPDATE venues SET latitude = -6.2380, longitude = 106.7960, address = 'Jl. Hang Lekir 2 No.30, Kebayoran Baru, South Jakarta' WHERE id = '145878f7-5f06-4e5c-9636-aa1c90a0d20d';

-- CJ's Bar - The Mulia: Jl. Asia Afrika, Senayan, Jakarta
UPDATE venues SET latitude = -6.2180, longitude = 106.8050, address = 'Hotel Mulia Senayan, Jl. Asia Afrika, Jakarta 10270' WHERE id = '257e93f6-3ebc-4fa3-81e3-143ea2ea1d79';

-- Costess: Cyber 2 Tower 17th Floor, Kuningan
UPDATE venues SET latitude = -6.2240, longitude = 106.8340, address = 'Cyber 2 Tower, 17th Floor, Jl. H.R. Rasuna Said Blok X-5, Kav. 13, Jakarta 12950' WHERE id = '3f674575-a843-44d4-bd3a-501bf92e0fe9';

-- Glitz: Kuningan City, Jl. Prof Dr Satrio
UPDATE venues SET latitude = -6.2270, longitude = 106.8270, address = 'Kuningan City, Jl. Prof Dr Satrio, South Jakarta' WHERE id = 'b4cce3a3-ca33-44ca-8bad-453f471e9069';

-- Greyhound: Jl. Sunda No. 5, Menteng, Jakarta Pusat
UPDATE venues SET latitude = -6.1900, longitude = 106.8290, address = 'Jl. Sunda No. 5, Menteng, Jakarta Pusat 11350' WHERE id = 'bb881010-516b-44e3-8b70-477a15cb6d17';

-- Juntos: Lotte Mall Jakarta, Jl. Prof Dr Satrio, Kuningan
UPDATE venues SET latitude = -6.2250, longitude = 106.8230, address = 'Lotte Mall Jakarta, Jl. Prof Dr Satrio, Karet Kuningan, Setiabudi' WHERE id = '380c5067-da65-43cc-b9ca-8ad7009c8ec8';

-- K22 Bar Terrace: Fairmont Jakarta, Jl. Asia Afrika No. 8, Senayan
UPDATE venues SET latitude = -6.2190, longitude = 106.8070, address = 'Fairmont Jakarta, Jl. Asia Afrika No. 8, Jakarta 10270' WHERE id = 'e8930423-1f41-48fa-b81d-1689e20f2a93';

-- Paulaner: Hotel Indonesia Kempinski, Jl. M.H. Thamrin
UPDATE venues SET latitude = -6.1950, longitude = 106.8230, address = 'Hotel Indonesia Kempinski, Jl. M.H. Thamrin No. 1, Jakarta 10310' WHERE id = '380debfa-5382-4541-9a1b-2037af715448';

-- Now backfill promo coordinates from these newly geocoded venues
UPDATE promos p
SET 
  venue_latitude = v.latitude,
  venue_longitude = v.longitude
FROM venues v
WHERE p.venue_id = v.id
  AND v.latitude IS NOT NULL
  AND v.longitude IS NOT NULL
  AND p.venue_latitude IS NULL;