
CREATE OR REPLACE FUNCTION create_reservation_tx(
  p_venue_id TEXT,
  p_guest_name TEXT,
  p_guest_phone TEXT,
  p_party_size INT,
  p_reservation_date DATE,
  p_reservation_time TIME,
  p_table_id UUID DEFAULT NULL,
  p_floor_id UUID DEFAULT NULL,
  p_duration_minutes INT DEFAULT 90,
  p_special_requests TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_guest_id UUID;
  v_floor_id UUID;
  v_reservation_datetime TIMESTAMPTZ;
  v_reservation RECORD;
  v_conflict_count INT;
  v_result JSON;
BEGIN
  -- 1. Get or create guest (atomic UPSERT via unique constraint)
  INSERT INTO guests (venue_id, full_name, phone_number)
  VALUES (p_venue_id, p_guest_name, p_guest_phone)
  ON CONFLICT (venue_id, phone_number)
  DO UPDATE SET full_name = EXCLUDED.full_name
  RETURNING id INTO v_guest_id;

  -- 2. Pessimistic lock: lock the table row to prevent concurrent bookings
  IF p_table_id IS NOT NULL THEN
    PERFORM 1 FROM tables WHERE id = p_table_id FOR UPDATE;

    -- 3. Check availability under lock (overlap detection using minutes)
    SELECT COUNT(*) INTO v_conflict_count
    FROM reservations
    WHERE table_id = p_table_id
      AND reservation_date = p_reservation_date
      AND status NOT IN ('cancelled', 'no_show', 'completed')
      AND (
        (EXTRACT(HOUR FROM reservation_time) * 60 + EXTRACT(MINUTE FROM reservation_time))
        < (EXTRACT(HOUR FROM p_reservation_time) * 60 + EXTRACT(MINUTE FROM p_reservation_time) + p_duration_minutes)
        AND
        (EXTRACT(HOUR FROM reservation_time) * 60 + EXTRACT(MINUTE FROM reservation_time) + COALESCE(duration_minutes, 90))
        > (EXTRACT(HOUR FROM p_reservation_time) * 60 + EXTRACT(MINUTE FROM p_reservation_time))
      );

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Table is not available at this time';
    END IF;
  END IF;

  -- 4. Resolve floor_id from table if not provided
  v_floor_id := p_floor_id;
  IF p_table_id IS NOT NULL AND v_floor_id IS NULL THEN
    SELECT floor_id INTO v_floor_id FROM tables WHERE id = p_table_id;
  END IF;

  -- 5. Build reservation datetime
  v_reservation_datetime := (p_reservation_date || 'T' || p_reservation_time)::TIMESTAMPTZ;

  -- 6. Insert reservation (atomic with all checks above)
  INSERT INTO reservations (
    venue_id, guest_id, guest_name, guest_phone, party_size,
    reservation_date, reservation_time, reservation_datetime,
    duration_minutes, table_id, floor_id, special_requests,
    status, confirmed_at
  ) VALUES (
    p_venue_id, v_guest_id, p_guest_name, p_guest_phone, p_party_size,
    p_reservation_date, p_reservation_time, v_reservation_datetime,
    p_duration_minutes, p_table_id, v_floor_id, p_special_requests,
    'confirmed', NOW()
  ) RETURNING * INTO v_reservation;

  -- 7. Atomic counter increment (no read-then-write race condition)
  UPDATE guests
  SET total_reservations = COALESCE(total_reservations, 0) + 1
  WHERE id = v_guest_id;

  -- 8. Build JSON result with joined table/floor details
  SELECT json_build_object(
    'id', v_reservation.id,
    'venue_id', v_reservation.venue_id,
    'guest_id', v_reservation.guest_id,
    'guest_name', v_reservation.guest_name,
    'guest_phone', v_reservation.guest_phone,
    'party_size', v_reservation.party_size,
    'reservation_date', v_reservation.reservation_date,
    'reservation_time', v_reservation.reservation_time,
    'reservation_datetime', v_reservation.reservation_datetime,
    'duration_minutes', v_reservation.duration_minutes,
    'table_id', v_reservation.table_id,
    'floor_id', v_reservation.floor_id,
    'special_requests', v_reservation.special_requests,
    'internal_notes', v_reservation.internal_notes,
    'status', v_reservation.status,
    'confirmed_at', v_reservation.confirmed_at,
    'seated_at', v_reservation.seated_at,
    'completed_at', v_reservation.completed_at,
    'cancelled_at', v_reservation.cancelled_at,
    'cancellation_reason', v_reservation.cancellation_reason,
    'created_at', v_reservation.created_at,
    'is_walk_in', v_reservation.is_walk_in,
    'tables', (
      SELECT json_build_object('table_identifier', t.table_identifier, 'max_capacity', t.max_capacity)
      FROM tables t WHERE t.id = v_reservation.table_id
    ),
    'floors', (
      SELECT json_build_object('floor_name', f.floor_name)
      FROM floors f WHERE f.id = v_reservation.floor_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
