-- Create a view for calculating real-time table status
-- This view determines if a table is Available, Occupied, or Reserved based on current time

CREATE OR REPLACE VIEW table_status_view AS
SELECT 
  t.id AS table_id,
  t.venue_id,
  t.floor_id,
  t.table_identifier,
  t.max_capacity,
  t.position_x,
  t.position_y,
  t.shape,
  t.width,
  t.height,
  
  -- Current reservation (if any)
  r.id AS current_reservation_id,
  r.guest_name,
  r.guest_phone,
  r.party_size,
  r.reservation_datetime,
  r.duration_minutes,
  r.special_requests,
  
  -- Calculate table status based on current time
  CASE
    -- Table is OCCUPIED if there's a 'seated' reservation right now
    WHEN EXISTS (
      SELECT 1 FROM reservations r2
      WHERE r2.table_id = t.id
        AND r2.status = 'seated'
        AND r2.reservation_datetime <= NOW()
        AND (r2.reservation_datetime + (r2.duration_minutes || ' minutes')::INTERVAL) > NOW()
    ) THEN 'occupied'
    
    -- Table is RESERVED if there's a future 'confirmed' reservation
    WHEN EXISTS (
      SELECT 1 FROM reservations r2
      WHERE r2.table_id = t.id
        AND r2.status = 'confirmed'
        AND r2.reservation_datetime > NOW()
    ) THEN 'reserved'
    
    -- Otherwise table is AVAILABLE
    ELSE 'available'
  END AS status,
  
  -- Color coding for UI
  CASE
    WHEN EXISTS (
      SELECT 1 FROM reservations r2
      WHERE r2.table_id = t.id AND r2.status = 'seated'
        AND r2.reservation_datetime <= NOW()
        AND (r2.reservation_datetime + (r2.duration_minutes || ' minutes')::INTERVAL) > NOW()
    ) THEN '#ff9800'  -- Orange for occupied
    
    WHEN EXISTS (
      SELECT 1 FROM reservations r2
      WHERE r2.table_id = t.id AND r2.status = 'confirmed'
        AND r2.reservation_datetime > NOW()
    ) THEN '#4caf50'  -- Green for reserved
    
    ELSE '#f5f5f5'    -- Gray/white for available
  END AS status_color

FROM tables t
LEFT JOIN reservations r ON r.table_id = t.id 
  AND r.status IN ('confirmed', 'seated')
  AND r.reservation_datetime <= NOW() + INTERVAL '15 minutes'
WHERE t.is_active = true;

-- Index the underlying tables for view performance
CREATE INDEX IF NOT EXISTS idx_reservations_active_status 
  ON reservations(table_id, status, reservation_datetime) 
  WHERE status IN ('confirmed', 'seated');

COMMENT ON VIEW table_status_view IS 'Real-time table status calculation: available, occupied, or reserved';
