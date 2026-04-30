CREATE TABLE call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
  vapi_call_id TEXT UNIQUE NOT NULL,
  assistant_id TEXT,
  caller_phone TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  outcome TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  recording_url TEXT,
  transcript JSONB,
  summary TEXT,
  cost NUMERIC(10, 4),
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  ended_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_logs_venue_id ON call_logs(venue_id);
CREATE INDEX idx_call_logs_vapi_call_id ON call_logs(vapi_call_id);
CREATE INDEX idx_call_logs_started_at ON call_logs(started_at DESC);
CREATE INDEX idx_call_logs_reservation_id ON call_logs(reservation_id);
