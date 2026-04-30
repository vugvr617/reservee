-- Create guests table for managing customer information
-- Supports guest history, preferences, and contact details

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
  
  -- Guest Information
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  
  -- Guest Profile
  preferences JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  
  -- Statistics (denormalized for performance)
  total_reservations INTEGER DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  total_no_shows INTEGER DEFAULT 0,
  last_visit_date TIMESTAMPTZ,
  
  -- Status
  is_blacklisted BOOLEAN DEFAULT false,
  is_vip BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(venue_id, phone_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_guests_venue_id ON guests(venue_id);
CREATE INDEX IF NOT EXISTS idx_guests_phone ON guests(venue_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(venue_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guests_vip ON guests(venue_id, is_vip) WHERE is_vip = true;
CREATE INDEX IF NOT EXISTS idx_guests_name ON guests USING gin(to_tsvector('english', full_name));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_guests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guests_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW
  EXECUTE FUNCTION update_guests_updated_at();

-- Comments
COMMENT ON TABLE guests IS 'Guest registry for tracking customer information and history';
COMMENT ON COLUMN guests.phone_number IS 'Primary contact - must be unique per venue';
COMMENT ON COLUMN guests.preferences IS 'JSONB for dietary restrictions, seating preferences, etc.';
COMMENT ON COLUMN guests.total_reservations IS 'Denormalized count - updated via trigger';
COMMENT ON COLUMN guests.is_blacklisted IS 'Prevent future reservations (e.g., repeated no-shows)';
