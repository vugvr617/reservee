-- Create tables table for managing restaurant tables with full visual data
-- Stores position, shape, size, and capacity for dashboard rendering

CREATE TABLE IF NOT EXISTS tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  
  -- Table Identification
  table_identifier TEXT NOT NULL,
  table_number INTEGER,
  
  -- Visual Properties (for dashboard rendering)
  position_x DECIMAL(10,2) NOT NULL,
  position_y DECIMAL(10,2) NOT NULL,
  width DECIMAL(10,2) NOT NULL DEFAULT 100,
  height DECIMAL(10,2) NOT NULL DEFAULT 100,
  
  shape TEXT NOT NULL DEFAULT 'square',
  rotation DECIMAL(5,2) DEFAULT 0,
  
  -- Capacity
  min_capacity INTEGER NOT NULL DEFAULT 2,
  max_capacity INTEGER NOT NULL DEFAULT 4,
  
  -- Styling (optional - for custom table colors/themes)
  style_config JSONB DEFAULT '{
    "borderColor": "#333333",
    "backgroundColor": "#ffffff",
    "borderWidth": 2
  }'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(venue_id, table_identifier),
  CHECK (shape IN ('square', 'round', 'rectangular', 'oval')),
  CHECK (min_capacity > 0),
  CHECK (max_capacity >= min_capacity),
  CHECK (rotation >= 0 AND rotation < 360),
  CHECK (width > 0 AND height > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tables_venue_id ON tables(venue_id);
CREATE INDEX IF NOT EXISTS idx_tables_floor_id ON tables(floor_id);
CREATE INDEX IF NOT EXISTS idx_tables_active ON tables(venue_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tables_identifier ON tables(venue_id, table_identifier);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tables_updated_at
  BEFORE UPDATE ON tables
  FOR EACH ROW
  EXECUTE FUNCTION update_tables_updated_at();

-- Comments
COMMENT ON TABLE tables IS 'Stores restaurant tables with visual layout data for dashboard rendering';
COMMENT ON COLUMN tables.table_identifier IS 'Human-readable table ID (e.g., "MF-01", "Rooftop-5")';
COMMENT ON COLUMN tables.position_x IS 'X coordinate on floor canvas for visual positioning';
COMMENT ON COLUMN tables.position_y IS 'Y coordinate on floor canvas for visual positioning';
COMMENT ON COLUMN tables.shape IS 'Table shape: square, round, rectangular, or oval';
COMMENT ON COLUMN tables.max_capacity IS 'Primary capacity - max number of guests';
COMMENT ON COLUMN tables.style_config IS 'JSONB config for custom styling (colors, borders, etc.)';
