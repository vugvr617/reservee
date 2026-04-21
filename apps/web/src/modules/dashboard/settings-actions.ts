"use server";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";
import type { VenueData, TimeSlot, AIConfig } from "@/modules/onboarding/types";
import { normalizeVenue } from "@/lib/domain/venue/normalize";
import { createVapiAssistant, updateVapiAssistant } from "@/lib/domain/vapi/service";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getVenueSettings(): Promise<{
  success: boolean;
  data?: VenueData;
  error?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const { data, error } = await supabase
    .from("venue")
    .select("*")
    .eq("userId", session.user.id)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message || "Venue not found" };
  }

  return { success: true, data: normalizeVenue(data) };
}

async function loadVenueForSync(userId: string): Promise<VenueData | null> {
  const { data } = await supabase
    .from("venue")
    .select("*")
    .eq("userId", userId)
    .single();
  return data ? normalizeVenue(data) : null;
}

async function syncVapi(venue: VenueData, aiConfig: AIConfig | null): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!venue.vapiAgentId || !aiConfig) {
    return { ok: true };
  }
  try {
    await updateVapiAssistant(
      venue.vapiAgentId,
      venue,
      aiConfig,
      venue.fallbackPhone || ""
    );
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to sync AI assistant",
    };
  }
}

export async function updateVenueProfile(profile: {
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  venueName: string;
  address: string;
  city: string;
  country: string;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const venue = await loadVenueForSync(session.user.id);
  if (!venue) return { success: false, error: "Venue not found" };

  const sync = await syncVapi({ ...venue, ...profile }, venue.aiConfig);
  if (!sync.ok) return { success: false, error: sync.error };

  const { error } = await supabase
    .from("venue")
    .update({ ...profile, updatedAt: new Date().toISOString() })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateOperatingHours(data: {
  schedule: TimeSlot[];
}): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const venue = await loadVenueForSync(session.user.id);
  if (!venue) return { success: false, error: "Venue not found" };

  const sync = await syncVapi({ ...venue, schedule: data.schedule }, venue.aiConfig);
  if (!sync.ok) return { success: false, error: sync.error };

  const { error } = await supabase
    .from("venue")
    .update({
      schedule: data.schedule,
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateAIConfig(config: {
  voiceId: string;
  customGreeting: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const venue = await loadVenueForSync(session.user.id);
  if (!venue) return { success: false, error: "Venue not found" };

  const aiConfig: AIConfig = {
    ai_voice_provider: "elevenlabs",
    ai_voice_id: config.voiceId,
    ai_custom_greeting: config.customGreeting || null,
  };

  const sync = await syncVapi(venue, aiConfig);
  if (!sync.ok) return { success: false, error: sync.error };

  const { error } = await supabase
    .from("venue")
    .update({
      ai_config: aiConfig,
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function retryAISync(): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const venue = await loadVenueForSync(session.user.id);
  if (!venue) return { success: false, error: "Venue not found" };

  // Guard: only failed state can retry. Anything else silently refuses so
  // a forged request can't overwrite a working assistant.
  if (venue.aiStatus !== "failed") {
    return { success: false, error: "AI is not in a failed state" };
  }

  if (!venue.aiConfig) {
    return {
      success: false,
      error: "Voice and greeting are not set — complete onboarding first",
    };
  }

  try {
    let vapiAgentId = venue.vapiAgentId;

    if (vapiAgentId) {
      // Assistant exists in Vapi — push current config to reconcile state.
      await updateVapiAssistant(
        vapiAgentId,
        venue,
        venue.aiConfig,
        venue.fallbackPhone || ""
      );
    } else {
      // No assistant ever created — build one and link it.
      const assistant = await createVapiAssistant(
        venue,
        venue.aiConfig,
        venue.fallbackPhone || ""
      );
      vapiAgentId = assistant.id;

      // Link on the phone_numbers row if present so webhook routing still works.
      const { data: venueRow } = await supabase
        .from("venue")
        .select("id")
        .eq("userId", session.user.id)
        .single();
      if (venueRow?.id) {
        await supabase
          .from("phone_numbers")
          .update({ vapi_assistant_id: vapiAgentId })
          .eq("venue_id", venueRow.id)
          .eq("is_primary", true);
      }
    }

    const { error } = await supabase
      .from("venue")
      .update({
        vapi_agent_id: vapiAgentId,
        ai_status: "ready",
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", session.user.id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("retryAISync failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sync AI assistant",
    };
  }
}

export async function updateFallbackPhone(
  fallbackPhone: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("venue")
    .update({
      fallbackPhone,
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getPhoneNumberData(): Promise<{
  success: boolean;
  data?: {
    id: string;
    phone_number: string;
    phone_country: string;
    phone_provider: string;
    phone_status: string;
    monthly_cost: number | null;
    is_primary: boolean;
    purchased_at: string;
  };
  error?: string;
}> {
  const session = await getSession();
  if (!session?.user?.id) return { success: false, error: "Not authenticated" };

  const { data: venue } = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .single();

  if (!venue) return { success: false, error: "Venue not found" };

  const { data, error } = await supabase
    .from("phone_numbers")
    .select("*")
    .eq("venue_id", venue.id)
    .eq("is_primary", true)
    .single();

  if (error || !data) return { success: false, error: "No phone number found" };

  return { success: true, data };
}
