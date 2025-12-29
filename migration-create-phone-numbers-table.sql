-- Create phone_numbers table for managing venue phone numbers
-- This allows multiple phone numbers per venue and stores all Vapi/Twilio integration details

CREATE TABLE IF NOT EXISTS phone_numbers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL REFERENCES venue(id) ON DELETE CASCADE,

  -- Phone Number Details
  phone_number TEXT NOT NULL,                    -- E.g., "+49 30 12345678"
  phone_country TEXT NOT NULL,                   -- ISO code: "DE", "US", etc.
  fallback_phone_number TEXT,                    -- E.g., "+49 151 23456789"

  -- Provider Details (Twilio)
  phone_provider TEXT NOT NULL DEFAULT 'twilio', -- Future: support other providers
  phone_provider_sid TEXT NOT NULL,              -- Twilio SID: "PNxxxx"
  monthly_cost DECIMAL(10,2),                    -- Monthly cost in USD

  -- Vapi Integration
  vapi_phone_id TEXT NOT NULL,                   -- Vapi's phone number ID (from import response)
  vapi_assistant_id TEXT NOT NULL,               -- Linked Vapi assistant ID

  -- Status & Metadata
  phone_status TEXT NOT NULL DEFAULT 'provisioning', -- 'provisioning' | 'active' | 'inactive' | 'suspended'
  is_primary BOOLEAN DEFAULT false,              -- Primary number for venue
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(phone_number),
  UNIQUE(vapi_phone_id),
  UNIQUE(phone_provider_sid)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_numbers_venue_id ON phone_numbers(venue_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_status ON phone_numbers(phone_status);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_vapi_assistant ON phone_numbers(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_primary ON phone_numbers(venue_id, is_primary) WHERE is_primary = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_phone_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER phone_numbers_updated_at
  BEFORE UPDATE ON phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_phone_numbers_updated_at();

-- Comments for documentation
COMMENT ON TABLE phone_numbers IS 'Stores phone numbers purchased for venues with Vapi/Twilio integration details';
COMMENT ON COLUMN phone_numbers.vapi_phone_id IS 'ID returned from Vapi phone import API - critical for managing the number';
COMMENT ON COLUMN phone_numbers.vapi_assistant_id IS 'Vapi assistant linked to this phone number';
COMMENT ON COLUMN phone_numbers.phone_provider_sid IS 'Twilio phone number SID (PNxxxx format)';
COMMENT ON COLUMN phone_numbers.is_primary IS 'Indicates if this is the primary phone number for the venue';
