-- Add foreign key constraint between event_attendees and profiles
ALTER TABLE event_attendees 
ADD CONSTRAINT fk_attendees_user_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;