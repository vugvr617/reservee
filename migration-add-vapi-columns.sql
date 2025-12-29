-- Migration: Add Vapi AI Receptionist columns to venue table
-- Run this in your Supabase SQL Editor

ALTER TABLE venue
ADD COLUMN IF NOT EXISTS vapi_assistant_id TEXT,
ADD COLUMN IF NOT EXISTS vapi_phone_number TEXT,
ADD COLUMN IF NOT EXISTS voice_id TEXT,
ADD COLUMN IF NOT EXISTS voice_name TEXT,
ADD COLUMN IF NOT EXISTS voice_greeting TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_vapi_assistant_id ON venue(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_venue_voice_id ON venue(voice_id);

-- Add comment for documentation
COMMENT ON COLUMN venue.vapi_assistant_id IS 'Vapi AI assistant ID for the venue';
COMMENT ON COLUMN venue.vapi_phone_number IS 'Phone number assigned by Vapi for the AI receptionist';
COMMENT ON COLUMN venue.voice_id IS 'ElevenLabs voice ID selected for the AI receptionist';
COMMENT ON COLUMN venue.voice_name IS 'Display name of the selected voice';
COMMENT ON COLUMN venue.voice_greeting IS 'Auto-generated greeting message for the AI receptionist';
