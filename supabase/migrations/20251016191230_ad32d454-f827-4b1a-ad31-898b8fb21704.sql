-- Add note column to event_attendees table
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS note text;