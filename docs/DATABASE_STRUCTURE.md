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

---

### 3. `floors` Table
Manages multiple floors/layers for venue table layouts (e.g., Main Floor, Rooftop, Patio, Mezzanine).

#### Columns:
- `id` (UUID) - Primary key
- `venue_id` (TEXT) - Foreign key to venue(id)
- `floor_name` (TEXT) - Floor name (e.g., "Main Floor", "Rooftop") - UNIQUE per venue
- `floor_order` (INTEGER) - Display order (lower = first) - UNIQUE per venue
- `layout_config` (JSONB) - Canvas configuration:
  ```json
  {
    "width": 1200,
    "height": 800,
    "backgroundColor": "#f5f5f5",
    "gridSize": 20,
    "snapToGrid": true
  }
  ```
- `is_active` (BOOLEAN) - Soft delete flag

#### Timestamps:
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Indexes:
- `idx_floors_venue_id` - On venue_id
- `idx_floors_active` - On (venue_id, is_active) WHERE is_active = true
- `idx_floors_order` - On (venue_id, floor_order)

---

### 4. `tables` Table
Stores restaurant tables with full visual positioning data for dashboard rendering.

#### Columns:
- `id` (UUID) - Primary key
- `venue_id` (TEXT) - Foreign key to venue(id)
- `floor_id` (UUID) - Foreign key to floors(id)
- `table_identifier` (TEXT) - Human-readable ID (e.g., "MF-01", "RT-05") - UNIQUE per venue
- `table_number` (INTEGER) - Optional numeric identifier

#### Visual Properties:
- `position_x` (DECIMAL) - X coordinate on canvas
- `position_y` (DECIMAL) - Y coordinate on canvas
- `width` (DECIMAL) - Table width in pixels
- `height` (DECIMAL) - Table height in pixels
- `shape` (TEXT) - Table shape: 'square', 'round', 'rectangular', 'oval'
- `rotation` (DECIMAL) - Rotation in degrees (0-360)

#### Capacity:
- `min_capacity` (INTEGER) - Minimum guests (default: 2)
- `max_capacity` (INTEGER) - Maximum guests (default: 4)

#### Styling:
- `style_config` (JSONB) - Custom styling:
  ```json
  {
    "borderColor": "#333333",
    "backgroundColor": "#ffffff",
    "borderWidth": 2
  }
  ```

#### Metadata:
- `is_active` (BOOLEAN) - Soft delete flag
- `notes` (TEXT) - Internal notes (e.g., "Near window", "VIP area")

#### Timestamps:
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Indexes:
- `idx_tables_venue_id` - On venue_id
- `idx_tables_floor_id` - On floor_id
- `idx_tables_active` - On (venue_id, is_active) WHERE is_active = true
- `idx_tables_identifier` - On (venue_id, table_identifier)

---

### 5. `guests` Table
Guest registry for tracking customer information and reservation history.

#### Columns:
- `id` (UUID) - Primary key
- `venue_id` (TEXT) - Foreign key to venue(id)
- `full_name` (TEXT) - Guest full name
- `phone_number` (TEXT) - Primary contact - UNIQUE per venue
- `email` (TEXT) - Optional email

#### Guest Profile:
- `preferences` (JSONB) - Dietary restrictions, seating preferences, etc.
- `notes` (TEXT) - VIP status, allergies, special occasions

#### Statistics (denormalized):
- `total_reservations` (INTEGER) - Total reservation count
- `total_cancellations` (INTEGER) - Cancelled reservation count
- `total_no_shows` (INTEGER) - No-show count
- `last_visit_date` (TIMESTAMPTZ) - Most recent reservation date

#### Status:
- `is_blacklisted` (BOOLEAN) - Block future reservations
- `is_vip` (BOOLEAN) - VIP guest marker

#### Timestamps:
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

#### Indexes:
- `idx_guests_venue_id` - On venue_id
- `idx_guests_phone` - On (venue_id, phone_number)
- `idx_guests_email` - On (venue_id, email) WHERE email IS NOT NULL
- `idx_guests_vip` - On (venue_id, is_vip) WHERE is_vip = true
- `idx_guests_name` - GIN index on to_tsvector('english', full_name)

---

### 6. `reservations` Table
Core reservation management with comprehensive status tracking.

#### Columns:
- `id` (UUID) - Primary key
- `venue_id` (TEXT) - Foreign key to venue(id)
- `guest_id` (UUID) - Foreign key to guests(id) - ON DELETE RESTRICT
- `table_id` (UUID) - Foreign key to tables(id) - ON DELETE SET NULL
- `floor_id` (UUID) - Foreign key to floors(id) - ON DELETE SET NULL (denormalized)

#### Reservation Details:
- `reservation_date` (DATE) - Date of reservation
- `reservation_time` (TIME) - Time slot (e.g., 19:00)
- `reservation_datetime` (TIMESTAMPTZ) - Combined datetime (source of truth)
- `duration_minutes` (INTEGER) - Expected duration (default: 120)
- `party_size` (INTEGER) - Number of guests

#### Guest Information (denormalized):
- `guest_name` (TEXT) - From guests table (for performance)
- `guest_phone` (TEXT) - From guests table (for performance)

#### Status Management:
- `status` (TEXT) - Lifecycle status:
  - `pending` - Reservation created, awaiting confirmation
  - `confirmed` - Reservation confirmed
  - `seated` - Guest seated at table
  - `completed` - Reservation completed
  - `cancelled` - Reservation cancelled
  - `no_show` - Guest did not show up

#### Special Requests:
- `special_requests` (TEXT) - Dietary needs, occasion, seating preference
- `internal_notes` (TEXT) - Staff-only notes

#### Status Timestamps:
- `confirmed_at` (TIMESTAMPTZ) - When reservation was confirmed
- `seated_at` (TIMESTAMPTZ) - When guests were seated
- `completed_at` (TIMESTAMPTZ) - When guests left
- `cancelled_at` (TIMESTAMPTZ) - Cancellation timestamp
- `cancellation_reason` (TEXT) - Why it was cancelled

#### Metadata:
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)
- `created_by` (TEXT) - User ID who created reservation

#### Indexes:
- `idx_reservations_venue_id` - On venue_id
- `idx_reservations_guest_id` - On guest_id
- `idx_reservations_table_id` - On table_id
- `idx_reservations_floor_id` - On floor_id
- `idx_reservations_datetime` - On (venue_id, reservation_datetime)
- `idx_reservations_date` - On (venue_id, reservation_date)
- `idx_reservations_status` - On (venue_id, status)
- `idx_reservations_today` - On (venue_id, reservation_date, status) WHERE status IN ('confirmed', 'seated')
- `idx_reservations_no_double_booking` - UNIQUE ON (table_id, reservation_datetime) WHERE status IN ('confirmed', 'seated') AND table_id IS NOT NULL
- `idx_reservations_active_status` - On (table_id, status, reservation_datetime) WHERE status IN ('confirmed', 'seated')

---

### 7. `table_status_view` (View)
Real-time table status calculation for dashboard rendering.

#### Returns:
- `table_id` (UUID) - Table ID
- `venue_id` (TEXT) - Venue ID
- `floor_id` (UUID) - Floor ID
- `table_identifier` (TEXT) - Table identifier
- `max_capacity` (INTEGER) - Max capacity
- `position_x`, `position_y` (DECIMAL) - Position coordinates
- `shape` (TEXT) - Table shape
- `width`, `height` (DECIMAL) - Table dimensions
- `current_reservation_id` (UUID) - Active reservation ID (if any)
- `guest_name` (TEXT) - Guest name (if reserved/occupied)
- `guest_phone` (TEXT) - Guest phone (if reserved/occupied)
- `party_size` (INTEGER) - Party size (if reserved/occupied)
- `reservation_datetime` (TIMESTAMPTZ) - Reservation time (if reserved/occupied)
- `duration_minutes` (INTEGER) - Duration (if reserved/occupied)
- `special_requests` (TEXT) - Special requests (if reserved/occupied)
- `status` (TEXT) - **Calculated status**:
  - `'occupied'` - Reservation status = 'seated' AND current time within reservation window
  - `'reserved'` - Reservation status = 'confirmed' AND reservation_datetime in future
  - `'available'` - No active reservations
- `status_color` (TEXT) - Hex color for UI:
  - `'#ff9800'` - Orange for occupied
  - `'#4caf50'` - Green for reserved
  - `'#f5f5f5'` - Gray for available

#### Usage:
```sql
-- Get all tables with real-time status
SELECT * FROM table_status_view
WHERE venue_id = 'venue-123'
  AND floor_id = 'floor-456'
ORDER BY table_identifier;
```

---

## Database Relationships

```
venue (existing)
  ├─→ floors (1:M)
  │     └─→ tables (1:M)
  │           └─→ reservations (1:M)
  ├─→ guests (1:M)
  │     └─→ reservations (1:M)
  └─→ phone_numbers (1:M) (existing)
```

### Foreign Key Details:
- `floors.venue_id` → `venue.id` (CASCADE)
- `tables.venue_id` → `venue.id` (CASCADE)
- `tables.floor_id` → `floors.id` (CASCADE)
- `guests.venue_id` → `venue.id` (CASCADE)
- `reservations.venue_id` → `venue.id` (CASCADE)
- `reservations.guest_id` → `guests.id` (RESTRICT)
- `reservations.table_id` → `tables.id` (SET NULL)
- `reservations.floor_id` → `floors.id` (SET NULL)

---

## Common Query Patterns

### Get Today's Reservations
```sql
SELECT r.*, t.table_identifier, f.floor_name
FROM reservations r
LEFT JOIN tables t ON t.id = r.table_id
LEFT JOIN floors f ON f.id = r.floor_id
WHERE r.venue_id = $1
  AND r.reservation_date = CURRENT_DATE
  AND r.status IN ('confirmed', 'seated')
ORDER BY r.reservation_time;
```

### Get All Tables with Current Status
```sql
SELECT * FROM table_status_view
WHERE venue_id = $1
  AND floor_id = $2
ORDER BY table_identifier;
```

### Find Available Tables for Time Slot
```sql
SELECT t.* FROM tables t
WHERE t.venue_id = $1
  AND t.max_capacity >= $2  -- Party size
  AND t.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM reservations r
    WHERE r.table_id = t.id
      AND r.status IN ('confirmed', 'seated')
      AND r.reservation_datetime <= $3  -- Desired time
      AND (r.reservation_datetime + (r.duration_minutes || ' minutes')::INTERVAL) > $3
  );
```

---

## Migrations Applied

1. `create_phone_numbers_table.sql` - Created phone_numbers table
2. `refactor_ai_config.sql` - Refactored venue table AI configuration
3. `create_floors_table` - Created floors table for multi-floor support
4. `create_tables_table` - Created tables table with visual layout data
5. `create_guests_table` - Created guests table for customer registry
6. `create_reservations_table` - Created reservations table with status tracking
7. `create_table_status_view` - Created view for real-time table status calculation
