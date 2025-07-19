-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS party_style TEXT;

-- Add constraints for age if needed
ALTER TABLE profiles ADD CONSTRAINT age_range CHECK (age IS NULL OR (age >= 18 AND age <= 100));

-- Add comments for documentation
COMMENT ON COLUMN profiles.gender IS 'User gender preference (male, female, non-binary, prefer-not-to-say)';
COMMENT ON COLUMN profiles.age IS 'User age (18-100)';
COMMENT ON COLUMN profiles.instagram IS 'Instagram handle (with or without @)';
COMMENT ON COLUMN profiles.whatsapp IS 'WhatsApp number for contact';
COMMENT ON COLUMN profiles.party_style IS 'Preferred party style (clubbing, rooftop-parties, etc.)';