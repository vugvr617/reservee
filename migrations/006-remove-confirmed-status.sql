-- Remove "confirmed" status from reservations
-- Merge all "confirmed" reservations into "pending"

-- Step 1: Update existing confirmed reservations to pending
UPDATE reservations
SET status = 'pending'
WHERE status = 'confirmed';

-- Step 2: Drop the old check constraint and recreate without "confirmed"
-- (The constraint name may vary — drop if exists patterns)
DO $$
BEGIN
  -- Try to drop known constraint names
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'reservations_status_check'
    AND conrelid = 'reservations'::regclass
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT reservations_status_check;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'status_check'
    AND conrelid = 'reservations'::regclass
  ) THEN
    ALTER TABLE reservations DROP CONSTRAINT status_check;
  END IF;

  -- Drop any check constraint that references 'confirmed' on the status column
  PERFORM 1 FROM pg_constraint c
  WHERE c.conrelid = 'reservations'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%confirmed%';

  IF FOUND THEN
    DECLARE
      _conname text;
    BEGIN
      FOR _conname IN
        SELECT c.conname FROM pg_constraint c
        WHERE c.conrelid = 'reservations'::regclass
          AND c.contype = 'c'
          AND pg_get_constraintdef(c.oid) LIKE '%confirmed%'
      LOOP
        EXECUTE format('ALTER TABLE reservations DROP CONSTRAINT %I', _conname);
      END LOOP;
    END;
  END IF;
END $$;

-- Step 3: Add new check constraint without "confirmed"
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('pending', 'seated', 'completed', 'cancelled', 'no_show'));
