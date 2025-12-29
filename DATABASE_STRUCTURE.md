# Database Structure - Reservee

## Overview
This document describes the database schema for Reservee's venue onboarding and AI telephony system.

## Tables

### 1. `venue` Table
Stores venue information and AI configuration.

#### Columns:
- `id` (TEXT) - Primary key
- `userId` (TEXT) - Foreign key to user
- `managerName` (TEXT)
- `managerEmail` (TEXT)
- `managerPhone` (TEXT)
- `venueName` (TEXT)
- `address` (TEXT)
- `city` (TEXT)
- `country` (TEXT)
- `fallbackPhone` (TEXT) - Fallback phone for transfers
- `schedule` (JSONB) - Array of TimeSlot objects

#### AI Configuration:
- `ai_config` (JSONB) - AI voice configuration object:
  ```json
  {
    "ai_voice_provider": "elevenlabs",
    "ai_voice_id": "xjlfQQ3ynqiEyRpArrT8",
    "ai_custom_greeting": "Hello! Welcome to..."
  }
  ```
- `vapi_agent_id` (TEXT) - Vapi assistant/agent ID (set after assistant creation)
- `ai_status` (TEXT) - AI configuration lifecycle status:
  - `draft` - AI config saved but Vapi assistant not created yet (Step 3 completed)
  - `ready` - Vapi assistant successfully created and linked (Step 4 completed)
  - `failed` - Assistant creation encountered an error (needs retry)

#### Onboarding:
- `onboardingStatus` (TEXT) - `in-progress` | `completed`
- `onboardingStep` (INTEGER) - Current step (1-4)

#### Timestamps:
- `createdAt` (TIMESTAMPTZ)
- `updatedAt` (TIMESTAMPTZ)

---

### 2. `phone_numbers` Table
Stores phone numbers with Vapi/Twilio integration details. Supports multiple phone numbers per venue.

#### Columns:
- `id` (UUID) - Primary key
- `venue_id` (TEXT) - Foreign key to venue(id)

#### Phone Details:
- `phone_number` (TEXT) - E.g., "+49 30 12345678" (UNIQUE)
- `phone_country` (TEXT) - ISO code: "DE", "US", etc.
- `fallback_phone_number` (TEXT) - Fallback for transfers

#### Provider Details (Twilio):
- `phone_provider` (TEXT) - Default: "twilio"
- `phone_provider_sid` (TEXT) - Twilio SID (UNIQUE)
- `monthly_cost` (DECIMAL) - Monthly cost in USD

#### Vapi Integration:
- `vapi_phone_id` (TEXT) - Vapi's phone number ID (UNIQUE)
- `vapi_assistant_id` (TEXT) - Linked Vapi assistant ID

#### Status & Metadata:
- `phone_status` (TEXT) - `provisioning` | `active` | `inactive` | `suspended`
- `is_primary` (BOOLEAN) - Primary number for venue
- `purchased_at` (TIMESTAMPTZ)

#### Timestamps:
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Indexes:
- `idx_phone_numbers_venue_id` - On venue_id
- `idx_phone_numbers_status` - On phone_status
- `idx_phone_numbers_vapi_assistant` - On vapi_assistant_id
- `idx_phone_numbers_primary` - On (venue_id, is_primary) WHERE is_primary = true

---

## Onboarding Flow

### Step 1: Business Details
Saves to `venue`:
- managerName, managerEmail, managerPhone
- venueName, address, city, country
- Sets `onboardingStep = 2`

### Step 2: Schedule
Saves to `venue`:
- schedule (JSONB array of TimeSlot)
- Sets `onboardingStep = 3`

### Step 3: AI Voice Selection
Saves to `venue`:
- `ai_config` (JSONB with voice provider, voice ID, and custom greeting)
- `ai_status = 'draft'` ← AI config saved, but assistant not created yet
- Sets `onboardingStep = 4`

### Step 4: Phone Number Purchase
1. **Purchase Twilio number**
2. **Create Vapi assistant** with complete context (phone, fallback, schedule, etc.)
3. **Import number to Vapi**
4. **Save to `phone_numbers` table**:
   - All Twilio details (phone_provider_sid, monthly_cost)
   - All Vapi IDs (vapi_phone_id, vapi_assistant_id)
   - Phone status, fallback number
5. **Update `venue` table**:
   - `vapi_agent_id = assistant.id`
   - `ai_status = 'ready'` ← Assistant successfully created
6. **On Error**:
   - Sets `ai_status = 'failed'` if assistant creation fails

---

## Key Design Decisions

### ✅ Normalized Structure
- Phone numbers in separate table (one-to-many with venue)
- Supports multiple phone numbers per venue

### ✅ AI Config as JSONB
- Flexible schema for AI configuration
- Easy to add new voice providers or settings
- All voice-related settings in one place

### ✅ Complete Vapi Integration
- Stores both `vapi_phone_id` and `vapi_assistant_id`
- Enables full management of Vapi resources

### ✅ Status Tracking
- **`ai_status`** lifecycle:
  - `draft` → Voice config saved in Step 3, waiting for assistant creation
  - `ready` → Vapi assistant created successfully in Step 4
  - `failed` → Assistant creation failed (can retry)
- **`phone_status`** lifecycle:
  - `provisioning` → Number being set up
  - `active` → Number active and receiving calls
  - `inactive` → Number disabled
  - `suspended` → Number temporarily suspended

### ✅ Removed Redundant Fields
Deleted from venue table:
- ❌ `voice_id` (now in ai_config)
- ❌ `voice_name` (not needed)
- ❌ `voice_greeting` (now in ai_config)
- ❌ `vapi_assistant_id` (renamed to vapi_agent_id)
- ❌ `vapi_phone_number` (moved to phone_numbers table)
- ❌ `twilio_phone_sid` (moved to phone_numbers table)
- ❌ `phone_status` (moved to phone_numbers table)

---

## TypeScript Interfaces

```typescript
export interface AIConfig {
  ai_voice_provider: 'elevenlabs';
  ai_voice_id: string;
  ai_tone: string;
  ai_speaking_style: string;
  ai_custom_greeting: string | null;
}

export interface VenueData {
  id: string;
  userId: string;
  managerName: string | null;
  managerEmail: string | null;
  managerPhone: string | null;
  venueName: string | null;
  fallbackPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  schedule: TimeSlot[] | null;

  // AI Configuration
  aiConfig: AIConfig | null;
  vapiAgentId: string | null;
  aiStatus: 'draft' | 'ready' | 'failed';

  onboardingStatus: "in-progress" | "completed";
  onboardingStep: number;
}

export interface PhoneNumberData {
  id: string;
  venueId: string;
  phoneNumber: string;
  phoneCountry: string;
  fallbackPhoneNumber: string | null;
  phoneProvider: 'twilio';
  phoneProviderSid: string;
  monthlyCost: number | null;
  vapiPhoneId: string;
  vapiAssistantId: string;
  phoneStatus: 'provisioning' | 'active' | 'inactive' | 'suspended';
  isPrimary: boolean;
  purchasedAt: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## Migrations Applied

1. `create_phone_numbers_table.sql` - Created phone_numbers table
2. `refactor_ai_config.sql` - Refactored venue table AI configuration
