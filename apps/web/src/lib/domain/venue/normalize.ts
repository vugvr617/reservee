import type { VenueData } from "@/modules/onboarding/types";

export function normalizeVenue(raw: any): VenueData {
  if (!raw) return raw;
  return {
    ...raw,
    aiConfig: raw.ai_config ?? raw.aiConfig ?? null,
    aiStatus: raw.ai_status ?? raw.aiStatus ?? "draft",
    vapiAgentId: raw.vapi_agent_id ?? raw.vapiAgentId ?? null,
    fallbackPhone: raw.fallbackPhone ?? raw.fallback_phone ?? null,
  };
}
