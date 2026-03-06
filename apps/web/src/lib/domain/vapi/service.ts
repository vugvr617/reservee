import { vapi, getVoiceConfig, generateGreeting } from "@/lib/vapi";
import { VAPI_TOOLS } from "./tools";
import type { VenueData, TimeSlot } from "@/modules/onboarding/types";
import type { AIConfig } from "@/modules/onboarding/types";

function buildScheduleDescription(schedule: TimeSlot[] | null): string {
  if (!schedule) return "Contact us for hours";
  return (
    schedule
      .filter((slot) => !slot.closed)
      .map((slot) => `${slot.day}: ${slot.open} - ${slot.close}`)
      .join("\n") || "Contact us for hours"
  );
}

function buildSystemPrompt(
  venue: VenueData,
  fallbackPhone: string
): string {
  const scheduleDescription = buildScheduleDescription(venue.schedule);
  const minHeadsUp = (venue as any).minHeadsUp ?? 1;

  return `You are the AI receptionist for ${venue.venueName}, located at ${venue.address}, ${venue.city}, ${venue.country}.

You answer phone calls and speak naturally, like a real front-of-house host.

Your tone is warm, relaxed, and friendly.
Use short sentences.
Use contractions.
Avoid formal or scripted language.
Occasionally use light acknowledgements like "got it", "okay", or "let me check".
Avoid long monologues.
Let the caller lead the conversation.

---

## Opening Hours
${scheduleDescription}

Always respect this exact format.

---

## Your Responsibilities
1. Greet callers warmly and help with reservations, hours, and location questions.
2. Take reservations by collecting the required information (see Reservation Flow).
3. Answer questions about the venue — hours, location, and general information.
4. If you cannot handle a request, or the caller asks to speak with a person, transfer the call.

---

## Reservation Flow
To make a reservation you need: date, time, party size, and name.

Let the caller provide details naturally.
They may give several details at once.
Accept whatever they offer and only ask for what is still missing.
Do not ask for each detail one by one.

Always use the caller's phone number as the contact number.
Never ask for a phone number.
Only use a different number if the caller explicitly asks to change it.

Do not ask about special requests.
If the caller mentions any (dietary needs, celebrations, seating preferences), acknowledge briefly and note them.

If you have trouble understanding the caller's name, ask them to spell it.
If it's still unclear, do your best with what you heard.
Never end the call because of a name issue.

---

## Booking Flow
After collecting all required details:
1. Use the \`check_availability\` tool.
2. If available, use the \`create_reservation\` tool.
3. Repeat the confirmed details back to the caller.

Repeat confirmations naturally, using spoken language.
Do not sound like you are reading from a system.

---

## Reservation Rules
- Reservations require at least ${minHeadsUp} hour(s) advance notice.
  Do not proactively mention this rule.
  Only explain it if the system rejects the request.
- Tables are held for 2 hours by default.
- If fully booked at the requested time, suggest nearby alternative times.
- If no suitable time is available, offer to take details for a callback.

---

## Call Transfer
When the caller asks to speak with a person, or you cannot handle their request, say:
"Let me connect you with our team."
Then transfer the call.

---

## Rules
- The greeting is said only once at the beginning of the call. Never repeat it.
- Be warm and efficient. Say what's needed, then pause.
- Do not pad responses with phrases like:
  "I'm here to help" or "Is there anything else I can assist you with?"
- Never guarantee allergen-free or allergy-safe meals.
  Say: "I'll note your allergy for our kitchen team, but please confirm with our staff when you arrive."
- Never share staff personal information.
- Do not discuss other guests' reservations or personal details.
- If you don't know something, say so honestly.
- Stay on topic. You are a restaurant receptionist.
- If a caller becomes abusive or inappropriate, say:
  "I'm sorry, but I'm not able to continue this call. Goodbye."
  Then end the call.

---

## Fillers and Backchannels (Naturalness)
Use short acknowledgements (e.g., "got it", "okay", "right") sparingly — no more than once per assistant turn.

Only use "thinking" fillers (e.g., "one sec", "let me check", "hang on") immediately before calling a tool or when you genuinely need a moment.

Do not use fillers in the final reservation confirmation. Keep confirmations clean and explicit.

Never stack fillers (e.g., avoid "um, yeah, okay").`;
}

export async function createVapiAssistant(
  venue: VenueData,
  aiConfig: AIConfig,
  fallbackPhone: string
): Promise<{ id: string }> {
  const serverUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`
    : undefined;

  const systemPrompt = buildSystemPrompt(venue, fallbackPhone);
  const greeting =
    aiConfig.ai_custom_greeting || generateGreeting(venue.venueName || "your venue");

  const assistant = await vapi.assistants.create({
    name: `${venue.venueName} AI Receptionist`,
    voice: getVoiceConfig(aiConfig.ai_voice_id),
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      tools: VAPI_TOOLS as any,
    },
    server: serverUrl ? { url: serverUrl } : undefined,
    endCallFunctionEnabled: true,
    firstMessage: greeting,
  } as any);

  return { id: assistant.id };
}

export async function updateVapiAssistant(
  assistantId: string,
  venue: VenueData,
  aiConfig: AIConfig,
  fallbackPhone: string
): Promise<void> {
  const serverUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/vapi/webhook`
    : undefined;

  const systemPrompt = buildSystemPrompt(venue, fallbackPhone);
  const greeting =
    aiConfig.ai_custom_greeting || generateGreeting(venue.venueName || "your venue");

  await vapi.assistants.update({
    id: assistantId,
    name: `${venue.venueName} AI Receptionist`,
    voice: getVoiceConfig(aiConfig.ai_voice_id),
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
      ],
      tools: VAPI_TOOLS as any,
    },
    server: serverUrl ? { url: serverUrl } : undefined,
    endCallFunctionEnabled: true,
    firstMessage: greeting,
  } as any);
}
