-- Backfill promo coordinates from linked venues
UPDATE promos p
SET 
  venue_latitude = v.latitude,
  venue_longitude = v.longitude
FROM venues v
WHERE p.venue_id = v.id
  AND v.latitude IS NOT NULL
  AND v.longitude IS NOT NULL
  AND p.venue_latitude IS NULL;