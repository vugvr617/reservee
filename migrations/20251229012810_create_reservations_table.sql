-- Create reservations table for managing restaurant bookings
-- Includes comprehensive status tracking and time-based logic

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id TEXT NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  floor_id UUID REFERENCES floors(id) ON DELETE SET NULL,
  
  -- Reservation Details
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  reservation_datetime TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  party_size INTEGER NOT NULL,
  
  -- Guest Information (denormalized for query performance)
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Special Requests
  special_requests TEXT,
  internal_notes TEXT,
  
  -- Timestamps & Tracking
  confirmed_at TIMESTAMPTZ,
  seated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  
  -- Constraints
  CHECK (status IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  CHECK (party_size > 0),
  CHECK (duration_minutes > 0),
  CHECK (reservation_datetime > created_at)
);

-- Indexes for performance (CRITICAL for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_reservations_venue_id ON reservations(venue_id);
CREATE INDEX IF NOT EXISTS idx_reservations_guest_id ON reservations(guest_id);
CREATE INDEX IF NOT EXISTS idx_reservations_table_id ON reservations(table_id);
CREATE INDEX IF NOT EXISTS idx_reservations_floor_id ON reservations(floor_id);

-- Time-based queries (most important for dashboard)
CREATE INDEX IF NOT EXISTS idx_reservations_datetime ON reservations(venue_id, reservation_datetime);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(venue_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(venue_id, status);

-- Composite index for "today's reservations" query
CREATE INDEX IF NOT EXISTS idx_reservations_today ON reservations(venue_id, reservation_date, status) 
  WHERE status IN ('confirmed', 'seated');

-- Prevent double-booking: same table can't have overlapping reservations
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_no_double_booking 
  ON reservations(table_id, reservation_datetime) 
  WHERE status IN ('confirmed', 'seated') AND table_id IS NOT NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- Trigger to sync denormalized guest data
CREATE OR REPLACE FUNCTION sync_reservation_guest_data()
RETURNS TRIGGER AS $$
BEGIN
  -- When guest_id changes, update denormalized guest info
  IF NEW.guest_id IS DISTINCT FROM OLD.guest_id THEN
    SELECT full_name, phone_number INTO NEW.guest_name, NEW.guest_phone
    FROM guests
    WHERE id = NEW.guest_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_sync_guest_data
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  WHEN (NEW.guest_id IS DISTINCT FROM OLD.guest_id)
  EXECUTE FUNCTION sync_reservation_guest_data();

-- Trigger to update guest statistics
CREATE OR REPLACE FUNCTION update_guest_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guests
    SET total_reservations = total_reservations + 1,
        last_visit_date = GREATEST(COALESCE(last_visit_date, NEW.reservation_datetime), NEW.reservation_datetime)
    WHERE id = NEW.guest_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status != 'no_show' AND NEW.status = 'no_show' THEN
      UPDATE guests SET total_no_shows = total_no_shows + 1 WHERE id = NEW.guest_id;
    END IF;
    IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
      UPDATE guests SET total_cancellations = total_cancellations + 1 WHERE id = NEW.guest_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reservations_update_guest_stats
  AFTER INSERT OR UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_guest_stats();

-- Comments
COMMENT ON TABLE reservations IS 'Manages restaurant reservations with comprehensive status tracking';
COMMENT ON COLUMN reservations.reservation_datetime IS 'Combined date+time with timezone - primary field for queries';
COMMENT ON COLUMN reservations.duration_minutes IS 'Expected reservation duration (default 2 hours)';
COMMENT ON COLUMN reservations.status IS 'Lifecycle: pending → confirmed → seated → completed (or cancelled/no_show)';
COMMENT ON COLUMN reservations.guest_name IS 'Denormalized from guests table for query performance';
COMMENT ON COLUMN reservations.table_id IS 'Can be NULL if table not assigned yet';
