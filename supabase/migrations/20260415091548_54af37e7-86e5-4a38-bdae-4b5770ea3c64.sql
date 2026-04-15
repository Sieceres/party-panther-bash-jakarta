
-- Fix coordinates for 1920 Lounge & Dining venue
UPDATE venues 
SET latitude = -6.2601, longitude = 106.8131 
WHERE id = '19db8740-2e3c-429d-a9dd-e13c0ec5800b';

-- Fix coordinates for the linked event
UPDATE events 
SET venue_latitude = -6.2601, venue_longitude = 106.8131 
WHERE venue_id = '19db8740-2e3c-429d-a9dd-e13c0ec5800b';

-- Also fix any promos linked to this venue
UPDATE promos 
SET venue_latitude = -6.2601, venue_longitude = 106.8131 
WHERE venue_id = '19db8740-2e3c-429d-a9dd-e13c0ec5800b';
