
-- Add is_recurrent column to events table
ALTER TABLE events
ADD COLUMN is_recurrent BOOLEAN DEFAULT FALSE;
