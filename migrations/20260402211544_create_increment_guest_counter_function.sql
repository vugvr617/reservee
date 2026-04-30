
CREATE OR REPLACE FUNCTION increment_guest_counter(
  p_guest_id UUID,
  p_column_name TEXT
) RETURNS VOID AS $$
BEGIN
  IF p_column_name NOT IN ('total_reservations', 'total_cancellations', 'total_no_shows') THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_name;
  END IF;

  EXECUTE format(
    'UPDATE guests SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    p_column_name, p_column_name
  ) USING p_guest_id;
END;
$$ LANGUAGE plpgsql;
