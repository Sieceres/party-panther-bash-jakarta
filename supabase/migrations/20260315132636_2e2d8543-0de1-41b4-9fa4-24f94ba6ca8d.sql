-- Delete venue-summary placeholder promos (they have no real promo data)
DELETE FROM promos 
WHERE (title LIKE '% Promos' OR title LIKE 'Promos at %')
  AND original_price_amount IS NULL 
  AND discounted_price_amount IS NULL;

-- Fix "Artiz Bar" → "Artoz Bar" in existing promos linked to the venue
UPDATE promos 
SET venue_name = 'Artoz Bar'
WHERE venue_id = 'a0535a84-2013-47e9-b202-93a2e1c72b12'
  AND venue_name != 'Artoz Bar';

-- Fix "Artiz Bar" in events too
UPDATE events 
SET venue_name = 'Artoz Bar'
WHERE venue_id = 'a0535a84-2013-47e9-b202-93a2e1c72b12'
  AND venue_name != 'Artoz Bar';