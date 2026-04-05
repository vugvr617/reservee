import { vapi } from "@/lib/vapi";
import type { CallLog, CallStats, TranscriptMessage } from "./types";

// ============================================
// Helpers
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapVapiCall(call: any): CallLog {
  const startedAt = call.startedAt || call.createdAt || null;
  const endedAt = call.endedAt || null;
  let durationSeconds = 0;
  if (startedAt && endedAt) {
    durationSeconds = Math.round(
      (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
    );
  }

  // Extract caller phone from customer object
  const callerPhone = call.customer?.number || null;

  // Extract recording URL
  const recordingUrl = call.artifact?.recordingUrl || call.recordingUrl || null;

  // Extract transcript text
  const transcript = call.artifact?.transcript || call.transcript || null;

  // Extract summary
  const summary = call.artifact?.summary || call.summary || null;

  // Extract structured messages
  const messages: TranscriptMessage[] | null =
    call.artifact?.messages || call.messages || null;

  return {
    id: call.id,
    assistantId: call.assistantId || null,
    status: call.status || "ended",
    type: call.type || null,
    startedAt,
    endedAt,
    durationSeconds,
    callerPhone,
    recordingUrl,
    transcript,
    summary,
    endedReason: call.endedReason || null,
    cost: call.cost ?? call.costBreakdown?.total ?? null,
    messages,
  };
}

function deriveOutcome(call: CallLog): string {
  if (!call.messages) return "inquiry";

  const toolCallMessages = call.messages.filter(
    (m) => m.role === "tool_calls" || m.toolCalls
  );
  const toolNames = toolCallMessages.flatMap((tc) => {
    const calls = tc.toolCalls || [];
    return calls.map((c) => c.function?.name || c.name || "");
  });

  if (toolNames.includes("create_reservation")) return "reservation_made";
  if (toolNames.includes("modify_reservation")) return "reservation_modified";
  if (toolNames.includes("cancel_reservation")) return "reservation_cancelled";

  if (
    call.endedReason === "customer-did-not-answer" ||
    call.endedReason === "customer-busy"
  ) {
    return "no_answer";
  }
  if (
    call.endedReason === "error" ||
    call.endedReason === "pipeline-error"
  ) {
    return "failed";
  }

  return "inquiry";
}

// ============================================
// Queries
// ============================================

export async function getCallLogs(
  assistantId: string,
  options: {
    limit?: number;
    createdAtGe?: string;
    createdAtLe?: string;
  } = {}
): Promise<{ success: boolean; data?: (CallLog & { outcome: string })[]; error?: string }> {
  try {
    if (!assistantId) {
      return { success: true, data: [] };
    }

    const calls = await vapi.calls.list({
      assistantId,
      limit: options.limit ?? 100,
      createdAtGe: options.createdAtGe,
      createdAtLe: options.createdAtLe,
    });

    const mapped = (calls as unknown as Array<Record<string, unknown>>).map((c) => {
      const call = mapVapiCall(c);
      return { ...call, outcome: deriveOutcome(call) };
    });

    // Sort by most recent first
    mapped.sort((a, b) => {
      const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
      const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
      return bTime - aTime;
    });

    return { success: true, data: mapped };
  } catch (err) {
    console.error("[call-logs] getCallLogs error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch calls from VAPI",
    };
  }
}

export async function getCallLogById(
  callId: string
): Promise<{ success: boolean; data?: CallLog & { outcome: string }; error?: string }> {
  try {
    const call = await vapi.calls.get({ id: callId });
    const mapped = mapVapiCall(call);
    return { success: true, data: { ...mapped, outcome: deriveOutcome(mapped) } };
  } catch (err) {
    console.error("[call-logs] getCallLogById error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch call from VAPI",
    };
  }
}

export async function getCallStats(
  assistantId: string,
  options: {
    createdAtGe?: string;
    createdAtLe?: string;
  } = {}
): Promise<{ success: boolean; data?: CallStats; error?: string }> {
  try {
    if (!assistantId) {
      return {
        success: true,
        data: { totalCalls: 0, avgDurationSeconds: 0, successRate: 0, totalReservationsMade: 0 },
      };
    }

    const calls = await vapi.calls.list({
      assistantId,
      limit: 100,
      createdAtGe: options.createdAtGe,
      createdAtLe: options.createdAtLe,
    });
    const mapped = (calls as unknown as Array<Record<string, unknown>>).map((c) => {
      const call = mapVapiCall(c);
      return { ...call, outcome: deriveOutcome(call) };
    });

    const endedCalls = mapped.filter((c) => c.status === "ended");
    const totalCalls = endedCalls.length;
    const totalReservationsMade = endedCalls.filter(
      (c) => c.outcome === "reservation_made"
    ).length;
    const durations = endedCalls
      .map((c) => c.durationSeconds)
      .filter((d) => d > 0);
    const avgDurationSeconds =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;
    const successRate =
      totalCalls > 0
        ? Math.round((totalReservationsMade / totalCalls) * 100)
        : 0;

    return {
      success: true,
      data: { totalCalls, avgDurationSeconds, successRate, totalReservationsMade },
    };
  } catch (err) {
    console.error("[call-logs] getCallStats error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch call stats",
    };
  }
}
