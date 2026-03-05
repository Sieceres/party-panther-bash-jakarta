-- Normalize area values to canonical casing
UPDATE promos SET area = 'Kuningan & Setiabudi' WHERE LOWER(area) = 'kuningan & setiabudi' AND area != 'Kuningan & Setiabudi';
UPDATE promos SET area = 'Sudirman & Thamrin' WHERE LOWER(area) = 'sudirman & thamrin' AND area != 'Sudirman & Thamrin';
UPDATE promos SET area = 'Menteng & Cikini' WHERE area ILIKE '%menteng%cikini%' AND area != 'Menteng & Cikini';

-- Fix the Aphrodite promo: change promo_type from 'Free Flow' to 'Other' 
UPDATE promos SET promo_type = 'Other' WHERE LOWER(title) LIKE '%aphrodite%bucket%' AND promo_type = 'Free Flow';