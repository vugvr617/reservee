# Thesis — Missing Features

## Part 1 — Core Backend & Dashboard Foundation

### 1. Audit Logging ✅
- ~~Create `reservation_audit_log` table~~
- ~~Log every reservation state change via PostgreSQL trigger~~
- ~~Add `modified_by`, `deleted_at`, `deleted_by` columns to reservations~~
- ~~Soft delete instead of hard delete~~
- ~~Activity Log page with timeline, stats, filters~~

### 2. Populate `created_by` / `modified_by` Fields ✅
- ~~Set `created_by` on INSERT (never overwritten)~~
- ~~Set `modified_by` on every operation~~
- ~~Dashboard actions → `owner:<userId>` / `staff:<userId>`~~
- ~~Vapi webhook → `ai_call`~~

### 3. Transaction Wrapping + Pessimistic Locking + Atomic Counters ✅
- ~~Wrap `createReservation` in a single PL/pgSQL function with BEGIN/COMMIT~~
- ~~Add `SELECT FOR UPDATE` on table rows during availability check~~
- ~~Replace read-then-write guest counter with `total_reservations = total_reservations + 1`~~
- ~~Call via `supabase.rpc()`~~

### 4. Staff Role
- Add `role` field to user table (`owner` / `staff`)
- Staff sees: dashboard, reservations, seat walk-ins, mark no-shows
- Staff cannot see: analytics, floor editor, AI config, onboarding
- Owner sees everything

### 5. Settings Pages
All settings are currently set during onboarding only — no way to edit them afterward.

#### 6a. Venue Profile Settings (`/dashboard/settings/profile`)
- Edit venue name, address, city, country
- Edit manager name, email, phone
- All fields exist in `venue` table but have no post-onboarding edit UI

#### 6b. Operating Hours Settings (`/dashboard/settings/hours`)
- Edit weekly schedule (open/close times per day, closed days)
- Edit fallback phone number (used for AI call transfers)
- Edit minimum advance booking hours (`minHeadsUp` — currently hardcoded to 1)
- Data lives in `venue.schedule` JSONB and `venue.fallbackPhone`

#### 6c. AI Agent Settings (`/dashboard/settings/ai`)
- Change AI voice (voice provider + voice ID)
- Set/edit custom greeting (`ai_custom_greeting` — field exists but was never populated)
- View AI status (draft / ready / failed)
- Must update the Vapi assistant when voice or greeting changes
- Data lives in `venue.ai_config` JSONB

#### 6d. Phone Number Management (`/dashboard/settings/phone`)
- View active phone number, provider, status, monthly cost
- View/edit fallback transfer number
- Data lives in `phone_numbers` table

---

## Part 2 — Analytics, CRM & Integrations

### 6. Analytics Dashboard & Reports
- Reservation trends over time (line chart)
- Peak hours heatmap or bar chart
- Occupancy rate visualization
- Cancellation/no-show rate breakdown
- Date range filtering
- Summary numbers: total reservations, cancellations, no-shows, busiest day, avg party size
- Use recharts library

### 7. Guest List / CRM Page
- Dedicated page to browse all guests for the venue
- Show: name, phone, email, VIP status, blacklist status, total visits, cancellations, no-shows, last visit date, notes
- Click a guest to see their full reservation history
- Staff/owner can edit notes, toggle VIP/blacklist

### 8. Customer Notifications
- Send email confirmation after reservation created via AI call
- Send email on modification or cancellation
- Use Resend or SendGrid

### 9. Real-Time Dashboard Updates
- Subscribe to `reservations` table changes via Supabase Realtime
- When AI creates/modifies/cancels a reservation during a call, dashboard auto-updates without page refresh
- Thesis promises "dashboard reflects reservation changes within 5 seconds"

---

## Part 3 — AI Bot Testing & Improvements

### Acceptance Criteria

#### 1. Create Reservation (Happy Path)
- [ ] Caller provides date, time, party size, and name → reservation created with all fields correct
- [ ] Caller provides multiple details at once ("table for 4 tomorrow at 7, name is John") → AI extracts all without asking one-by-one
- [ ] Caller's phone number is automatically saved as contact — AI never asks for phone number
- [ ] Reservation is always assigned to a table — never confirmed without a table

#### 2. Create Reservation (Edge Cases)
- [ ] Requested time slot is fully booked → AI suggests alternative nearby times (e.g., "7 PM is full, but I have 8 PM available")
- [ ] Requested party size doesn't fit any single table → AI informs caller clearly
- [ ] Caller requests a date in the past or too short notice → AI explains the restriction
- [ ] Tables on Floor 1 are full but Floor 2 has availability → AI finds and books the Floor 2 table

#### 3. Modify Reservation
- [ ] Caller asks to change time → AI finds existing reservation by phone number, updates time
- [ ] Caller asks to change date → AI checks availability on new date before confirming
- [ ] Caller asks to change party size → AI checks if current table fits new size, reassigns if needed
- [ ] Reservation not found by phone → AI asks for name and searches by name

#### 4. Cancel Reservation
- [ ] Caller asks to cancel → AI finds reservation, confirms cancellation with details (date, time, name)
- [ ] Caller has multiple reservations → AI clarifies which one to cancel
- [ ] Reservation not found → AI asks for name or different date

#### 5. General Conversation
- [ ] Caller asks about opening hours → AI responds with correct schedule
- [ ] Caller asks about location → AI responds with correct address
- [ ] Caller asks something the AI can't handle → AI offers to transfer to staff
- [ ] Caller provides unclear name → AI asks to spell it, doesn't hang up

---

## Part 4 — Production & Deployment

### 10. Deploy to Production
- Deploy frontend to Vercel
- Supabase project configured for production
- Environment variables set
- Custom domain setup

### 11. End-to-End Validation
- Test all features against thesis requirements
- Verify acceptance criteria pass rate (target 80-90%)
- Final cleanup and polish
