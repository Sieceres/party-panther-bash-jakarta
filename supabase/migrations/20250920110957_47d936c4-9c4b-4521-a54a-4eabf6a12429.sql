-- Add foreign key constraints to fix the relationship issues

-- Add foreign key constraint between event_attendees and profiles
ALTER TABLE event_attendees 
ADD CONSTRAINT fk_event_attendees_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);

-- Add foreign key constraint between event_comments and profiles
ALTER TABLE event_comments 
ADD CONSTRAINT fk_event_comments_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(user_id);