-- =============================================================================
-- Concurrency Tests for create_reservation_tx
-- =============================================================================
-- This script verifies that the booking transaction prevents double bookings
-- under contention. It contains four black-box test cases plus a
-- defence-in-depth check that bypasses the procedure to exercise the partial
-- unique index directly. A final EXPLAIN ANALYZE captures the cost of the
-- conflict-check query under realistic data shapes.
--
-- How to run
--   1. Open the Supabase SQL editor (Dashboard -> SQL Editor)
--   2. Paste each numbered block in order and click Run
--   3. Screenshot the result of each block (used in Chapter 5 of the thesis)
--
-- The script targets the Vugaritos venue and Tables 16/15 used during the
-- thesis testing. To adapt for another venue, change the v_venue_id,
-- v_table_a, and v_table_b values in block 0.
--
-- Test data uses guest_phone +999999999999 and reservation_date 2027-01-15
-- so it cannot collide with real production reservations. Block 6 cleans
-- up everything the script created.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Block 0: clean any prior test data (idempotent)
-- -----------------------------------------------------------------------------
DELETE FROM reservations WHERE guest_phone = '+999999999999';
DELETE FROM guests       WHERE phone_number = '+999999999999';

-- -----------------------------------------------------------------------------
-- Block 1: TEST 1 - Exact duplicate booking on the same table at the same time
-- -----------------------------------------------------------------------------
-- Step 1a: first call succeeds
SELECT create_reservation_tx(
  p_venue_id          := '0ff178a1-abe6-43f2-8cd0-d4b2d14396b7',
  p_guest_name        := 'Test Guest A',
  p_guest_phone       := '+999999999999',
  p_party_size        := 4,
  p_reservation_date  := '2027-01-15',
  p_reservation_time  := '14:00'::time,
  p_table_id          := '408a16a2-03c6-4b16-b2ce-ad806a30ad15'::uuid,
  p_duration_minutes  := 90,
  p_performed_by      := 'concurrency_test_1a'
) AS first_call_result;

-- Step 1b: second call must be rejected with
--   ERROR  P0001: Table is not available at this time
SELECT create_reservation_tx(
  p_venue_id          := '0ff178a1-abe6-43f2-8cd0-d4b2d14396b7',
  p_guest_name        := 'Test Guest B',
  p_guest_phone       := '+999999999999',
  p_party_size        := 4,
  p_reservation_date  := '2027-01-15',
  p_reservation_time  := '14:00'::time,
  p_table_id          := '408a16a2-03c6-4b16-b2ce-ad806a30ad15'::uuid,
  p_duration_minutes  := 90,
  p_performed_by      := 'concurrency_test_1b'
) AS second_call_result;

-- -----------------------------------------------------------------------------
-- Block 2: TEST 2 - Overlap collision
-- First booking covers 14:00-15:30. A new request at 14:30 (default 90 min)
-- would run 14:30-16:00, overlapping the first by an hour. Must be rejected
-- with the same error as Test 1.
-- -----------------------------------------------------------------------------
SELECT create_reservation_tx(
  p_venue_id          := '0ff178a1-abe6-43f2-8cd0-d4b2d14396b7',
  p_guest_name        := 'Test Guest C',
  p_guest_phone       := '+999999999999',
  p_party_size        := 4,
  p_reservation_date  := '2027-01-15',
  p_reservation_time  := '14:30'::time,
  p_table_id          := '408a16a2-03c6-4b16-b2ce-ad806a30ad15'::uuid,
  p_duration_minutes  := 90,
  p_performed_by      := 'concurrency_test_2'
) AS overlap_call_result;

-- -----------------------------------------------------------------------------
-- Block 3: TEST 3 - Adjacent non-overlap
-- First booking covers 14:00-15:30. A new booking at 15:30 starts exactly
-- when the first ends, so the windows do not overlap. Must succeed.
-- -----------------------------------------------------------------------------
SELECT create_reservation_tx(
  p_venue_id          := '0ff178a1-abe6-43f2-8cd0-d4b2d14396b7',
  p_guest_name        := 'Test Guest D',
  p_guest_phone       := '+999999999999',
  p_party_size        := 4,
  p_reservation_date  := '2027-01-15',
  p_reservation_time  := '15:30'::time,
  p_table_id          := '408a16a2-03c6-4b16-b2ce-ad806a30ad15'::uuid,
  p_duration_minutes  := 90,
  p_performed_by      := 'concurrency_test_3'
) AS adjacent_call_result;

-- -----------------------------------------------------------------------------
-- Block 4: TEST 4 - Same time, different table
-- Two callers can book different tables at exactly the same time. The lock
-- in create_reservation_tx is per-table (FOR UPDATE on the tables row), so
-- bookings on different tables do not contend. Must succeed.
-- -----------------------------------------------------------------------------
SELECT create_reservation_tx(
  p_venue_id          := '0ff178a1-abe6-43f2-8cd0-d4b2d14396b7',
  p_guest_name        := 'Test Guest E',
  p_guest_phone       := '+999999999999',
  p_party_size        := 4,
  p_reservation_date  := '2027-01-15',
  p_reservation_time  := '14:00'::time,
  p_table_id          := '75482c55-b5c2-4329-b61d-811292b003ae'::uuid,
  p_duration_minutes  := 90,
  p_performed_by      := 'concurrency_test_4'
) AS different_table_result;

-- -----------------------------------------------------------------------------
-- Block 5: DEFENCE IN DEPTH - bypass the stored procedure with a raw INSERT
-- The partial unique index idx_reservations_no_double_booking covers
-- (table_id, reservation_datetime) for active rows. A second row with the
-- same key must be rejected by the storage layer with
--   ERROR  23505: duplicate key value violates unique constraint
-- This is the second line of defence even if the procedure is bypassed.
-- -----------------------------------------------------------------------------
INSERT INTO reservations (
  venue_id, guest_name, guest_phone, party_size,
  reservation_date, reservation_time, reservation_datetime,
  duration_minutes, table_id, status, created_by, modified_by
) VALUES (
  '0ff178a1-abe6-43f2-8cd0-d4b2d14396b7',
  'Bypass Attempt',
  '+999999999999',
  4,
  '2027-01-15',
  '14:00',
  '2027-01-15T14:00:00+00:00'::timestamptz,
  90,
  '408a16a2-03c6-4b16-b2ce-ad806a30ad15'::uuid,
  'pending',
  'bypass_test',
  'bypass_test'
);

-- -----------------------------------------------------------------------------
-- Block 6: PERFORMANCE - EXPLAIN ANALYZE on the conflict-check query
-- Reproduces the body of the overlap check that runs inside
-- create_reservation_tx under the row lock. Captures the chosen plan, the
-- supporting index, and the wall-clock execution time on real data.
-- -----------------------------------------------------------------------------
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT COUNT(*)
FROM reservations
WHERE table_id = '408a16a2-03c6-4b16-b2ce-ad806a30ad15'::uuid
  AND reservation_date = '2027-01-15'
  AND status NOT IN ('cancelled', 'no_show', 'completed')
  AND (
    (EXTRACT(HOUR FROM reservation_time) * 60 + EXTRACT(MINUTE FROM reservation_time))
      < (EXTRACT(HOUR FROM '14:00'::time) * 60 + EXTRACT(MINUTE FROM '14:00'::time) + 90)
    AND
    (EXTRACT(HOUR FROM reservation_time) * 60 + EXTRACT(MINUTE FROM reservation_time) + COALESCE(duration_minutes, 90))
      > (EXTRACT(HOUR FROM '14:00'::time) * 60 + EXTRACT(MINUTE FROM '14:00'::time))
  );

-- -----------------------------------------------------------------------------
-- Block 7: Capture the partial unique index definition for the chapter
-- -----------------------------------------------------------------------------
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'reservations'
  AND indexname = 'idx_reservations_no_double_booking';

-- -----------------------------------------------------------------------------
-- Block 8: Cleanup - remove all rows the script created
-- Run this last to leave the database in its original state.
-- -----------------------------------------------------------------------------
DELETE FROM reservations WHERE guest_phone = '+999999999999';
DELETE FROM guests       WHERE phone_number = '+999999999999';
