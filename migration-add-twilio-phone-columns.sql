-- Migration: Add phone_status and Twilio SID columns to venue table
-- Run this in your Supabase SQL Editor

ALTER TABLE venue
ADD COLUMN IF NOT EXISTS phone_status TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_sid TEXT;

-- Comments
COMMENT ON COLUMN venue.phone_status IS 'Phone number setup status: active, pending_test, provisioning';
COMMENT ON COLUMN venue.twilio_phone_sid IS 'Twilio Phone Number SID (for management/deletion)';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_phone_status ON venue(phone_status);
CREATE INDEX IF NOT EXISTS idx_venue_twilio_phone_sid ON venue(twilio_phone_sid);
