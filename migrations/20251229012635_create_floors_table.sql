-- Create floors table for managing multiple floors per venue
-- Supports custom floor names like "Main Floor", "Rooftop", "Patio", "Mezzanine"

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
  
  -- Floor Details
  floor_name TEXT NOT NULL,
  floor_order INTEGER NOT NULL DEFAULT 0,
  
  -- Canvas/Layout Settings (for future UI rendering)
  layout_config JSONB DEFAULT '{
    "width": 1200,
    "height": 800,
    "backgroundColor": "#f5f5f5",
    "gridSize": 20,
    "snapToGrid": true
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(venue_id, floor_name),
  UNIQUE(venue_id, floor_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_floors_venue_id ON floors(venue_id);
CREATE INDEX IF NOT EXISTS idx_floors_active ON floors(venue_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_floors_order ON floors(venue_id, floor_order);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_floors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER floors_updated_at
  BEFORE UPDATE ON floors
  FOR EACH ROW
  EXECUTE FUNCTION update_floors_updated_at();

-- Comments
COMMENT ON TABLE floors IS 'Manages multiple floors/layers for venue table layouts';
COMMENT ON COLUMN floors.floor_order IS 'Display order - lower numbers appear first';
COMMENT ON COLUMN floors.layout_config IS 'JSONB config for canvas settings (width, height, grid, etc.)';
