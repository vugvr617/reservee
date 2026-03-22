"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentVenue } from "./get-current-venue";
import {
  getCallLogs as _getCallLogs,
  getCallLogById as _getCallLogById,
  getCallStats as _getCallStats,
} from "@/lib/domain/call-logs/service";

async function getVenueAssistantId(): Promise<string> {
  const venueId = await getCurrentVenue();
  const { data } = await supabase
    .from("venue")
    .select("vapi_agent_id")
    .eq("id", venueId)
    .single();

  return data?.vapi_agent_id || "";
}

export async function getCallLogs(options: {
  limit?: number;
  createdAtGe?: string;
  createdAtLe?: string;
}) {
  const assistantId = await getVenueAssistantId();
  return _getCallLogs(assistantId, options);
}

export async function getCallLogById(callId: string) {
  return _getCallLogById(callId);
}

export async function getCallStats() {
  const assistantId = await getVenueAssistantId();
  return _getCallStats(assistantId);
}
