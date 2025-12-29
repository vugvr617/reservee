-- Update ai_config to remove tone and speaking_style fields
-- Simplify to only store voice provider, voice ID, and custom greeting

-- Update existing ai_config records to remove tone and speaking_style
UPDATE venue
SET ai_config = jsonb_build_object(
  'ai_voice_provider', ai_config->>'ai_voice_provider',
  'ai_voice_id', ai_config->>'ai_voice_id',
  'ai_custom_greeting', ai_config->>'ai_custom_greeting'
)
WHERE ai_config IS NOT NULL;

-- Update comment
COMMENT ON COLUMN venue.ai_config IS 'JSONB config: ai_voice_provider, ai_voice_id, ai_custom_greeting';
