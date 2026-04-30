
-- 1. Add modified_by and soft-delete columns to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS modified_by text,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by text;

-- 2. Create audit log table
CREATE TABLE IF NOT EXISTS reservation_audit_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL,
  venue_id      uuid NOT NULL,
  action        text NOT NULL,
  old_values    jsonb,
  new_values    jsonb,
  changed_fields text[],
  performed_by  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_reservation_id ON reservation_audit_log(reservation_id);
CREATE INDEX IF NOT EXISTS idx_audit_venue_id ON reservation_audit_log(venue_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON reservation_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_venue_created ON reservation_audit_log(venue_id, created_at DESC);

-- 3. Trigger function
CREATE OR REPLACE FUNCTION fn_reservation_audit()
RETURNS TRIGGER AS $$
DECLARE
  v_action      text;
  v_old         jsonb := NULL;
  v_new         jsonb := NULL;
  v_changed     text[] := '{}';
  v_performed   text;
  v_venue_id    uuid;
  v_res_id      uuid;
BEGIN
  -- Determine action and build old/new JSONB
  IF TG_OP = 'INSERT' THEN
    v_action   := 'created';
    v_new      := to_jsonb(NEW);
    v_venue_id := NEW.venue_id;
    v_res_id   := NEW.id;
    v_performed := COALESCE(NEW.modified_by, NEW.created_by, 'unknown');

  ELSIF TG_OP = 'UPDATE' THEN
    v_old      := to_jsonb(OLD);
    v_new      := to_jsonb(NEW);
    v_venue_id := NEW.venue_id;
    v_res_id   := NEW.id;
    v_performed := COALESCE(NEW.modified_by, NEW.created_by, OLD.modified_by, OLD.created_by, 'unknown');

    -- Detect soft delete
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_action := 'deleted';
    -- Derive action from status change
    ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
      v_action := CASE NEW.status
        WHEN 'cancelled' THEN 'cancelled'
        WHEN 'seated'    THEN 'seated'
        WHEN 'no_show'   THEN 'no_show'
        WHEN 'completed' THEN 'completed'
        WHEN 'confirmed' THEN 'confirmed'
        ELSE 'modified'
      END;
    ELSE
      v_action := 'modified';
    END IF;

    -- Compute changed fields
    SELECT array_agg(key ORDER BY key) INTO v_changed
    FROM (
      SELECT key, value FROM jsonb_each(v_new)
      EXCEPT
      SELECT key, value FROM jsonb_each(v_old)
    ) diff;

  ELSIF TG_OP = 'DELETE' THEN
    v_action   := 'deleted';
    v_old      := to_jsonb(OLD);
    v_venue_id := OLD.venue_id;
    v_res_id   := OLD.id;
    v_performed := COALESCE(OLD.modified_by, OLD.created_by, 'unknown');
  END IF;

  -- Insert audit record
  INSERT INTO reservation_audit_log
    (reservation_id, venue_id, action, old_values, new_values, changed_fields, performed_by)
  VALUES
    (v_res_id, v_venue_id, v_action, v_old, v_new, v_changed, v_performed);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach trigger
DROP TRIGGER IF EXISTS trg_reservation_audit ON reservations;
CREATE TRIGGER trg_reservation_audit
  AFTER INSERT OR UPDATE OR DELETE
  ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION fn_reservation_audit();
