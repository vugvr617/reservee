-- Refactor AI configuration on venue table
-- Remove redundant fields and consolidate into ai_config JSONB

-- Step 1: Add new fields
ALTER TABLE venue ADD COLUMN IF NOT EXISTS ai_config JSONB;
ALTER TABLE venue ADD COLUMN IF NOT EXISTS vapi_agent_id TEXT;
ALTER TABLE venue ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'draft';

-- Step 2: Add check constraint for ai_status
ALTER TABLE venue ADD CONSTRAINT venue_ai_status_check
  CHECK (ai_status IN ('draft', 'ready', 'failed'));

-- Step 3: Migrate existing data to ai_config JSONB
UPDATE venue
SET ai_config = jsonb_build_object(
  'ai_voice_provider', 'elevenlabs',
  'ai_voice_id', voice_id,
  'ai_tone', 'professional',
  'ai_speaking_style', 'conversational',
  'ai_custom_greeting', voice_greeting
)
WHERE voice_id IS NOT NULL;

-- Step 4: Migrate vapi_assistant_id to vapi_agent_id (if exists)
UPDATE venue
SET vapi_agent_id = vapi_assistant_id
WHERE vapi_assistant_id IS NOT NULL;

-- Step 5: Drop old redundant columns
ALTER TABLE venue DROP COLUMN IF EXISTS voice_id;
ALTER TABLE venue DROP COLUMN IF EXISTS voice_name;
ALTER TABLE venue DROP COLUMN IF EXISTS voice_greeting;
ALTER TABLE venue DROP COLUMN IF EXISTS vapi_assistant_id;
ALTER TABLE venue DROP COLUMN IF EXISTS vapi_phone_number;
ALTER TABLE venue DROP COLUMN IF EXISTS twilio_phone_sid;
ALTER TABLE venue DROP COLUMN IF EXISTS phone_status;

-- Step 6: Add index on vapi_agent_id for performance
CREATE INDEX IF NOT EXISTS idx_venue_vapi_agent_id ON venue(vapi_agent_id);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN venue.ai_config IS 'JSONB config: ai_voice_provider, ai_voice_id, ai_tone, ai_speaking_style, ai_custom_greeting';
COMMENT ON COLUMN venue.vapi_agent_id IS 'Vapi assistant/agent ID created for this venue';
COMMENT ON COLUMN venue.ai_status IS 'AI configuration status: draft (not configured), ready (configured), failed (error during setup)';
