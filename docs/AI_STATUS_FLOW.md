# AI Status Flow - Explained

## What is `ai_status`?

The `ai_status` field tracks the lifecycle of the AI assistant configuration for each venue. It tells us whether the Vapi assistant has been created and is ready to handle calls.

## Status Values

### 1. `draft`
**When**: Set in **Step 3** (Voice Selection)
**Means**:
- User has selected their AI voice
- Voice configuration is saved to `ai_config`
- **But** the Vapi assistant has NOT been created yet

**Why wait?**: We need the phone number and fallback phone (from Step 4) to create the assistant with complete context.

### 2. `ready`
**When**: Set in **Step 4** (Phone Purchase) after successful assistant creation
**Means**:
- Vapi assistant successfully created
- `vapi_agent_id` is set
- Assistant is linked to phone number
- System is ready to receive calls

### 3. `failed`
**When**: Set in **Step 4** if assistant creation fails
**Means**:
- Twilio number might have been purchased
- **But** Vapi assistant creation encountered an error
- User needs to retry or contact support

**Common failure reasons**:
- Invalid Vapi API key
- Vapi service down
- Invalid voice ID
- Network timeout

## Status Flow Diagram

```
┌─────────────────┐
│   Step 1 & 2    │
│ Business Info   │
│   + Schedule    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Step 3      │
│ Voice Selection │
│                 │
│  ai_status:     │
│    "draft" ←────┼─── Config saved, assistant not created
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│     Step 4      │
│ Phone Purchase  │
│                 │
│  ┌───────────┐  │
│  │ Success?  │  │
│  └─────┬─────┘  │
│        │        │
│   ┌────┴────┐   │
│   │         │   │
│  YES       NO   │
│   │         │   │
│   ▼         ▼   │
│ "ready" "failed"│
└─────────────────┘
```

## Example Scenarios

### Scenario 1: Happy Path ✅
```typescript
// Step 3: User selects voice
venue.ai_config = {
  ai_voice_provider: 'elevenlabs',
  ai_voice_id: 'xjlfQQ3ynqiEyRpArrT8',
  ai_custom_greeting: 'Welcome to Pizza Palace!'
}
venue.ai_status = 'draft'
venue.vapi_agent_id = null

// Step 4: Purchase phone & create assistant
venue.vapi_agent_id = 'asst_abc123'
venue.ai_status = 'ready' ← ✅ All good!
```

### Scenario 2: Assistant Creation Fails ❌
```typescript
// Step 3: User selects voice
venue.ai_status = 'draft'

// Step 4: Phone purchase succeeds, but assistant creation fails
try {
  purchasePhoneNumber() // ✅ Succeeds
  createVapiAssistant() // ❌ Fails
} catch (error) {
  venue.ai_status = 'failed' ← ❌ Error occurred
  // User sees error, can retry
}
```

### Scenario 3: User Returns to Dashboard
```typescript
if (venue.ai_status === 'draft') {
  // Show: "Complete phone setup to activate AI"
}

if (venue.ai_status === 'ready') {
  // Show: "✓ AI Receptionist Active"
}

if (venue.ai_status === 'failed') {
  // Show: "⚠ Setup incomplete. Retry?"
}
```

## Why This Design?

### ✅ Separation of Concerns
- Voice config (Step 3) is saved separately from assistant creation (Step 4)
- User can save their voice preferences without committing to phone purchase

### ✅ Clear Error Handling
- If assistant creation fails, we know exactly what state we're in
- User can retry without losing their progress

### ✅ Flexibility for Future Features
- Can support "draft" assistants for testing
- Can rebuild/update assistants without changing phone numbers
- Can show different UI based on status

## Database Schema

```sql
CREATE TABLE venue (
  -- ...other fields...

  ai_config JSONB,              -- Voice configuration
  vapi_agent_id TEXT,           -- Vapi assistant ID (NULL until created)
  ai_status TEXT DEFAULT 'draft', -- draft | ready | failed

  CONSTRAINT venue_ai_status_check
    CHECK (ai_status IN ('draft', 'ready', 'failed'))
);
```

## Code Implementation

### Step 3: Save Voice Config
```typescript
await supabase
  .from("venue")
  .update({
    ai_config: {
      ai_voice_provider: 'elevenlabs',
      ai_voice_id: formData.voiceId,
      ai_custom_greeting: greeting,
    },
    ai_status: 'draft', // ← Not ready yet
  });
```

### Step 4: Create Assistant
```typescript
try {
  // Create assistant
  const assistant = await vapi.assistants.create({...});

  // Update venue
  await supabase
    .from("venue")
    .update({
      vapi_agent_id: assistant.id,
      ai_status: 'ready', // ← Now ready!
    });
} catch (error) {
  // Mark as failed
  await supabase
    .from("venue")
    .update({
      ai_status: 'failed', // ← Error occurred
    });
}
```
