-- Add role and staff_venue_id to the user table so admins can invite
-- restricted "staff" users that share an admin's venue.

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'admin'
    CHECK ("role" IN ('admin', 'staff'));

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "staff_venue_id" text NULL
    REFERENCES "venue"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS user_staff_venue_id_idx
  ON "user"("staff_venue_id");
