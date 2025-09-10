-- Fix foreign key relationship for user_favorite_promos table
ALTER TABLE user_favorite_promos 
ADD CONSTRAINT user_favorite_promos_promo_id_fkey 
FOREIGN KEY (promo_id) REFERENCES promos(id) ON DELETE CASCADE;