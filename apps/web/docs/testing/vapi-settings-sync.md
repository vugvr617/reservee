# Vapi Settings & Sync — Testing Guide

This doc covers manual tests for the settings-page rewrite:

- Onboarding creates an assistant that matches the live-tuned defaults
- Settings edits sync to Vapi on save (fail-fast if Vapi is down)
- Single source of truth for fallback phone (`venue.fallbackPhone`)
- Recording enabled by default
- Unsaved-changes guard + last-synced indicator

Prereqs: dev server running (`pnpm --filter web dev`), a venue that has completed onboarding (has `vapiAgentId`), and the Vugaritos assistant ID `05821b07-8395-484d-9a04-709ed6b5786d` for verification against Vapi.

---

## 1. Onboarding → new assistant matches tuned defaults

**Goal:** a brand-new onboarding produces an assistant whose config matches the live Vugaritos assistant (Azure / gpt-5.1 / voice tuning / recording / etc.).

1. Create a fresh account + venue, complete onboarding through Step 4 (phone purchase).
2. Grab the new `vapiAgentId` from the `venue` row in Supabase.
3. `curl -H "Authorization: Bearer $VAPI_PRIVATE_KEY" https://api.vapi.ai/assistant | jq '.[] | select(.id=="<newAssistantId>")'`
4. Verify:
   - `transcriber` = `{ provider: "azure", language: "en-US" }`
   - `voice.provider` = `"11labs"`, `voice.model` = `"eleven_turbo_v2_5"`, `voice.stability` = `0.5`, `voice.similarityBoost` = `0.75`
   - `model.provider` = `"openai"`, `model.model` = `"gpt-5.1-chat-latest"`
   - `server.url` set, `server.timeoutSeconds` = `20`
   - `endCallFunctionEnabled` = `true`
   - `backgroundDenoisingEnabled` = `false`
   - `artifactPlan.recordingEnabled` = `true`
   - `model.tools` has 5 entries; `cancel_reservation` / `modify_reservation` / `get_reservations` do NOT require `guest_name`
   - `model.messages[0].content` includes the `## Identifying the Caller for Modify, Cancel, Look-up` block

## 2. Live Vugaritos assistant was patched

One-time reconciliation already applied. Verify once to confirm it took:

```
curl -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  https://api.vapi.ai/assistant | \
  jq '.[] | select(.id=="05821b07-8395-484d-9a04-709ed6b5786d") |
      { tools: [.model.tools[].function.name],
        cancel_required: (.model.tools[] | select(.function.name=="cancel_reservation") | .function.parameters.required),
        recording: .artifactPlan.recordingEnabled,
        has_phone_section: (.model.messages[0].content | contains("Identifying the Caller")) }'
```

Expected:
- `cancel_required` = `["date"]`
- `recording` = `true`
- `has_phone_section` = `true`

## 3. AI Agent tab — voice + greeting sync on save

1. Open `/dashboard/settings` → AI Agent tab.
2. Verify status badge shows "Active" and `Last synced: <timestamp>` beneath it.
3. Change voice to a different one from the curated 6.
4. Edit greeting (e.g. `"Testing sync — {timestamp}"`).
5. Click **Save Changes**.
6. Toast: "AI agent settings updated successfully".
7. Fetch the live assistant via curl (see §2 query). Verify:
   - `voice.voiceId` = the new voiceId
   - `firstMessage` = the new greeting (or generated from venueName if empty)
8. `Last synced` timestamp updated.

**Negative test — Vapi fails:**

1. Temporarily break `VAPI_PRIVATE_KEY` in `.env` (add a char).
2. Restart dev server.
3. Edit greeting, Save.
4. Expect: error toast (e.g. `"Vapi error ..."`), greeting NOT persisted in DB (re-open tab, old value).
5. Restore key.

## 4. Operating Hours — schedule sync

1. AI Agent tab → note current `Last synced`.
2. Operating Hours tab. There should be NO fallback-phone input here anymore — just the weekly schedule.
3. Change Monday close from `22:00` → `23:00`. Save.
4. Fetch the live assistant prompt: `... | jq '.model.messages[0].content' | grep Monday` — should show `Monday: 09:00 - 23:00`.
5. Back to AI Agent tab — `Last synced` should be newer.

## 5. Profile — venue info sync

1. Profile tab. Change `venueName` → `"Vugaritos Test"`.
2. Save.
3. Check live assistant: `name` = `"Vugaritos Test AI Receptionist"`, and system prompt's first line reflects new venue name + address.
4. Revert venueName back.

## 6. Phone — fallback phone single source

1. Phone tab. Field shows current `venue.fallbackPhone` (not `phone_numbers.fallback_phone_number`).
2. Change to `+36700000001`. Save → toast success.
3. In Supabase: `select "fallbackPhone" from venue where "userId" = …` → matches.
4. Phone tab should read that value on reload.
5. Operating Hours tab no longer has this field (confirm).

**Regression — does editing fallback trigger Vapi sync?**

Today fallback is DB-only (not used by Vapi yet). Confirm no Vapi call is made: in `server.ts` request logs (or Vapi API dashboard) no `PATCH /assistant/:id` should appear right after saving the fallback.

## 7. Unsaved-changes guard

Per tab:
1. Open the tab.
2. Make any change (don't save).
3. Try to close the browser tab or refresh — expect native "Leave site?" prompt.
4. Stay, save, refresh — no prompt.

Tabs to cover: Profile, Operating Hours, AI Agent, Phone.

## 8. Recording is on for existing assistant

Already verified in §2. If you also want to confirm a call gets recorded: place a test call via Vapi dashboard → check `GET https://api.vapi.ai/call/<callId>` for an `artifactPlan` and a recording URL.

## 9. `ai_status` / normalized data

1. `select id, ai_status, ai_config, vapi_agent_id from venue where userId = '<you>'` — columns in snake_case.
2. In the UI, `AIAgentSection` reads `venue.aiConfig`, `venue.aiStatus`, `venue.vapiAgentId` (camelCase, via `normalizeVenue()`). Nothing breaks.
3. Sanity: temporarily null out `vapiAgentId` in DB, edit voice + save — expect success (sync skipped because assistant doesn't exist), DB updates. Restore.

## 10. Failure surfaces cleanly, no DB drift

If Vapi sync fails (see §3 negative test), assert `updatedAt` on the venue row is NOT advanced. In SQL:

```sql
select "updatedAt" from venue where "userId" = '...';
```

Same value before and after the failed save.

---

## What changed — code-level reference

| File | Purpose |
|---|---|
| `apps/web/src/lib/vapi.ts` | `getVoiceConfig` returns `model: eleven_turbo_v2_5`, `stability: 0.5`, `similarityBoost: 0.75` |
| `apps/web/src/lib/domain/vapi/service.ts` | Single `buildAssistantConfig()`; Azure + gpt-5.1-chat-latest + `server.timeoutSeconds: 20` + `artifactPlan.recordingEnabled: true`; `updateVapiAssistant` also sends transcriber |
| `apps/web/src/lib/domain/venue/normalize.ts` | New `normalizeVenue()` — snake_case → camelCase for `ai_config`, `ai_status`, `vapi_agent_id` |
| `apps/web/src/modules/onboarding/actions.ts` | `getVenue()` now normalizes; `purchasePhoneNumber` reads `venue.aiConfig` directly |
| `apps/web/src/modules/dashboard/settings-actions.ts` | All 3 update actions call `updateVapiAssistant` first (fail-fast), then DB. `updateFallbackPhone` writes `venue.fallbackPhone`. `updatePhoneFallback` removed. `updateOperatingHours` no longer takes `fallbackPhone`. |
| `apps/web/src/modules/dashboard/components/settings/*.tsx` | Removed fallback input from Operating Hours; Phone tab reads/writes `venue.fallbackPhone`; AI Agent removes snake_case hack + sync-disclaimer banner + adds `Last synced` indicator; all sections use `useUnsavedChangesGuard`. |
| `apps/web/src/modules/dashboard/hooks/use-unsaved-changes-guard.ts` | New `beforeunload` hook. |
| Live Vapi assistant `05821b07…` | PATCH'd: tool schemas (no `guest_name`), updated system prompt, `artifactPlan.recordingEnabled: true`. |
