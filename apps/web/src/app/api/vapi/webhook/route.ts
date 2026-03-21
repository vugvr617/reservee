import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getAvailableTablesForSlot,
  getReservationsForDate,
  createReservation,
  updateReservation,
  cancelReservation,
} from "@/lib/domain/reservations/service";

interface ToolCall {
  id: string;
  name?: string;
  arguments?: Record<string, unknown>;
  function?: {
    name: string;
    arguments: string | Record<string, unknown>;
  };
}

interface VapiMessage {
  message: {
    type: string;
    toolCallList?: ToolCall[];
    call?: {
      id: string;
      assistantId?: string;
      customer?: { number?: string };
    };
  };
}

function log(level: "INFO" | "WARN" | "ERROR", context: string, data: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    ...data,
  };
  if (level === "ERROR") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID().slice(0, 8);

  try {
    const body = await request.json();

    // Log the raw body to understand Vapi's payload structure
    log("INFO", "webhook:raw-body", {
      requestId,
      rawBody: JSON.stringify(body).slice(0, 2000),
    });

    const { message } = body;

    log("INFO", "webhook:incoming", {
      requestId,
      messageType: message.type,
      callId: message.call?.id,
      assistantId: message.call?.assistantId,
      callerPhone: message.call?.customer?.number,
      toolCallCount: message.toolCallList?.length ?? 0,
      toolCallNames: message.toolCallList?.map((tc: ToolCall) => tc.name) ?? [],
    });

    switch (message.type) {
      case "tool-calls":
        return handleToolCalls(message, requestId);

      case "status-update":
      case "end-of-call-report":
      case "transcript":
      case "hang":
        log("INFO", "webhook:passthrough", {
          requestId,
          messageType: message.type,
        });
        return NextResponse.json({ ok: true });

      default:
        log("WARN", "webhook:unknown-type", {
          requestId,
          messageType: message.type,
          rawBody: JSON.stringify(body).slice(0, 500),
        });
        return NextResponse.json({ ok: true });
    }
  } catch (error) {
    log("ERROR", "webhook:fatal", {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleToolCalls(message: VapiMessage["message"], requestId: string) {
  const toolCalls = message.toolCallList || [];
  const assistantId = message.call?.assistantId;
  const callerPhone = message.call?.customer?.number;

  log("INFO", "tool-calls:start", {
    requestId,
    assistantId,
    callerPhone,
    toolCalls: toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.name,
      arguments: tc.arguments,
    })),
  });

  // Look up venue by assistant ID
  const venueId = await getVenueIdByAssistant(assistantId);

  if (!venueId) {
    log("ERROR", "tool-calls:venue-not-found", {
      requestId,
      assistantId,
    });
    return NextResponse.json({
      results: toolCalls.map((tc) => ({
        toolCallId: tc.id,
        result: "Sorry, I'm unable to process your request right now. Please try calling again.",
      })),
    });
  }

  log("INFO", "tool-calls:venue-resolved", {
    requestId,
    venueId,
  });

  const results = await Promise.all(
    toolCalls.map((tc) => executeToolCall(tc, venueId, callerPhone, requestId))
  );

  log("INFO", "tool-calls:complete", {
    requestId,
    results: results.map((r) => ({
      toolCallId: r.toolCallId,
      resultPreview: r.result.slice(0, 200),
    })),
  });

  return NextResponse.json({ results });
}

async function executeToolCall(
  toolCall: ToolCall,
  venueId: string,
  callerPhone: string | undefined,
  requestId: string
) {
  // Normalize: Vapi sends name/arguments at top level for model.tools,
  // but under function.name / function.arguments for Custom Tools
  const id = toolCall.id;
  const name = toolCall.name || toolCall.function?.name || "unknown";
  const rawArgs = toolCall.arguments || toolCall.function?.arguments || {};
  const args: Record<string, unknown> =
    typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
  const startTime = Date.now();

  log("INFO", `tool:${name}:start`, {
    requestId,
    toolCallId: id,
    venueId,
    rawToolCall: JSON.stringify(toolCall).slice(0, 500),
    resolvedName: name,
    arguments: args,
  });

  try {
    let result: string;

    switch (name) {
      case "check_availability":
        result = await handleCheckAvailability(venueId, args, requestId);
        break;

      case "create_reservation":
        result = await handleCreateReservation(venueId, args, callerPhone, requestId);
        break;

      case "modify_reservation":
        result = await handleModifyReservation(venueId, args, requestId);
        break;

      case "cancel_reservation":
        result = await handleCancelReservation(venueId, args, requestId);
        break;

      case "get_reservations":
        result = await handleGetReservations(venueId, args, requestId);
        break;

      default:
        result = `Unknown function: ${name}`;
        log("WARN", "tool:unknown", {
          requestId,
          toolCallId: id,
          functionName: name,
        });
    }

    log("INFO", `tool:${name}:success`, {
      requestId,
      toolCallId: id,
      durationMs: Date.now() - startTime,
      result,
    });

    return { toolCallId: id, result };
  } catch (error) {
    log("ERROR", `tool:${name}:error`, {
      requestId,
      toolCallId: id,
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      toolCallId: id,
      result: "Sorry, something went wrong. Please try again.",
    };
  }
}

// ============================================
// Tool Handlers
// ============================================

async function handleCheckAvailability(
  venueId: string,
  args: Record<string, unknown>,
  requestId: string
): Promise<string> {
  const date = args.date as string;
  const time = args.time as string;
  const partySize = args.party_size as number;

  log("INFO", "check_availability:query", {
    requestId,
    venueId,
    date,
    time,
    partySize,
  });

  const result = await getAvailableTablesForSlot(
    supabase,
    venueId,
    date,
    time,
    90,
    partySize
  );

  if (!result.success || !result.data) {
    log("ERROR", "check_availability:failed", {
      requestId,
      error: result.error,
      success: result.success,
      hasData: !!result.data,
    });
    return "I'm unable to check availability right now. Please try again.";
  }

  log("INFO", "check_availability:result", {
    requestId,
    availableCount: result.data.length,
    tables: result.data.map((t) => ({
      id: t.id,
      identifier: t.tableIdentifier,
      capacity: `${t.minCapacity}-${t.maxCapacity}`,
    })),
  });

  if (result.data.length === 0) {
    return `No tables available for ${partySize} guests at ${time} on ${date}. Would you like to try a different time?`;
  }

  return `${result.data.length} table(s) available for ${partySize} guests at ${time} on ${date}. Shall I book one for you?`;
}

async function handleCreateReservation(
  venueId: string,
  args: Record<string, unknown>,
  callerPhone: string | undefined,
  requestId: string
): Promise<string> {
  const guestName = args.guest_name as string;
  const guestPhone = (args.guest_phone as string) || callerPhone || "";
  const date = args.date as string;
  const time = args.time as string;
  const partySize = args.party_size as number;
  const specialRequests = (args.special_requests as string) || undefined;

  log("INFO", "create_reservation:params", {
    requestId,
    venueId,
    guestName,
    guestPhone,
    date,
    time,
    partySize,
    specialRequests,
  });

  // Find a suitable table
  const tablesResult = await getAvailableTablesForSlot(
    supabase,
    venueId,
    date,
    time,
    90,
    partySize
  );

  const tableId =
    tablesResult.success && tablesResult.data && tablesResult.data.length > 0
      ? tablesResult.data[0].id
      : undefined;

  log("INFO", "create_reservation:table-selection", {
    requestId,
    tableId: tableId ?? "none",
    availableTables: tablesResult.data?.length ?? 0,
    selectedTable: tableId
      ? tablesResult.data?.find((t) => t.id === tableId)?.tableIdentifier
      : "none",
  });

  const result = await createReservation(supabase, {
    venueId,
    guestName,
    guestPhone,
    partySize,
    reservationDate: date,
    reservationTime: time,
    tableId,
    specialRequests,
  });

  if (!result.success) {
    log("ERROR", "create_reservation:failed", {
      requestId,
      error: result.error,
    });
    return `I wasn't able to complete the booking: ${result.error}. Would you like to try a different time?`;
  }

  log("INFO", "create_reservation:success", {
    requestId,
    reservationId: result.data?.id,
    tableIdentifier: result.data?.tableIdentifier,
  });

  const tableInfo = result.data?.tableIdentifier
    ? ` at table ${result.data.tableIdentifier}`
    : "";

  return `Reservation confirmed for ${guestName}, party of ${partySize}, on ${date} at ${time}${tableInfo}. Is there anything else I can help with?`;
}

async function handleModifyReservation(
  venueId: string,
  args: Record<string, unknown>,
  requestId: string
): Promise<string> {
  const guestName = args.guest_name as string;
  const originalDate = args.original_date as string;
  const newDate = (args.new_date as string) || undefined;
  const newTime = (args.new_time as string) || undefined;
  const newPartySize = (args.new_party_size as number) || undefined;

  log("INFO", "modify_reservation:params", {
    requestId,
    venueId,
    guestName,
    originalDate,
    newDate,
    newTime,
    newPartySize,
  });

  // Find the existing reservation
  const reservations = await getReservationsForDate(supabase, venueId, originalDate);

  if (!reservations.success || !reservations.data) {
    log("ERROR", "modify_reservation:lookup-failed", {
      requestId,
      error: reservations.error,
    });
    return "I'm unable to look up reservations right now. Please try again.";
  }

  log("INFO", "modify_reservation:lookup", {
    requestId,
    totalReservations: reservations.data.length,
    reservations: reservations.data.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      status: r.status,
      time: r.reservationTime,
    })),
  });

  const match = reservations.data.find(
    (r) =>
      r.guestName.toLowerCase() === guestName.toLowerCase() &&
      r.status !== "cancelled" &&
      r.status !== "completed"
  );

  if (!match) {
    log("WARN", "modify_reservation:not-found", {
      requestId,
      guestName,
      originalDate,
    });
    return `I couldn't find an active reservation under ${guestName} for ${originalDate}. Could you check the name or date?`;
  }

  log("INFO", "modify_reservation:matched", {
    requestId,
    reservationId: match.id,
    currentDate: match.reservationDate,
    currentTime: match.reservationTime,
    currentPartySize: match.partySize,
  });

  const updatedDate = newDate || match.reservationDate;
  const updatedTime = newTime || match.reservationTime;
  const updatedPartySize = newPartySize || match.partySize;

  // Check availability for the new slot if date or time changed
  if (newDate || newTime) {
    const availability = await getAvailableTablesForSlot(
      supabase,
      venueId,
      updatedDate,
      updatedTime,
      90,
      updatedPartySize,
      match.id
    );

    log("INFO", "modify_reservation:availability-check", {
      requestId,
      updatedDate,
      updatedTime,
      updatedPartySize,
      availableCount: availability.data?.length ?? 0,
    });

    if (!availability.success || !availability.data || availability.data.length === 0) {
      return `No tables available for ${updatedPartySize} guests at ${updatedTime} on ${updatedDate}. Would you like to try a different time?`;
    }
  }

  const result = await updateReservation(supabase, {
    id: match.id,
    venueId,
    guestName: match.guestName,
    guestPhone: match.guestPhone,
    partySize: updatedPartySize,
    reservationDate: updatedDate,
    reservationTime: updatedTime,
    tableId: match.tableId,
  });

  if (!result.success) {
    log("ERROR", "modify_reservation:update-failed", {
      requestId,
      error: result.error,
    });
    return `I wasn't able to modify the reservation: ${result.error}`;
  }

  const changes: string[] = [];
  if (newDate) changes.push(`date to ${newDate}`);
  if (newTime) changes.push(`time to ${newTime}`);
  if (newPartySize) changes.push(`party size to ${newPartySize}`);

  log("INFO", "modify_reservation:success", {
    requestId,
    reservationId: match.id,
    changes,
  });

  return `Reservation for ${guestName} has been updated: ${changes.join(", ")}. The booking is now on ${updatedDate} at ${updatedTime} for ${updatedPartySize} guests.`;
}

async function handleCancelReservation(
  venueId: string,
  args: Record<string, unknown>,
  requestId: string
): Promise<string> {
  const guestName = args.guest_name as string;
  const date = args.date as string;

  log("INFO", "cancel_reservation:params", {
    requestId,
    venueId,
    guestName,
    date,
  });

  // Find matching reservation
  const reservations = await getReservationsForDate(supabase, venueId, date);

  if (!reservations.success || !reservations.data) {
    log("ERROR", "cancel_reservation:lookup-failed", {
      requestId,
      error: reservations.error,
    });
    return "I'm unable to look up reservations right now. Please try again.";
  }

  log("INFO", "cancel_reservation:lookup", {
    requestId,
    totalReservations: reservations.data.length,
    reservations: reservations.data.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      status: r.status,
    })),
  });

  const match = reservations.data.find(
    (r) =>
      r.guestName.toLowerCase() === guestName.toLowerCase() &&
      r.status !== "cancelled" &&
      r.status !== "completed"
  );

  if (!match) {
    log("WARN", "cancel_reservation:not-found", {
      requestId,
      guestName,
      date,
    });
    return `I couldn't find an active reservation under ${guestName} for ${date}. Could you check the name or date?`;
  }

  log("INFO", "cancel_reservation:matched", {
    requestId,
    reservationId: match.id,
    time: match.reservationTime,
  });

  const result = await cancelReservation(
    supabase,
    match.id,
    "Cancelled via phone call"
  );

  if (!result.success) {
    log("ERROR", "cancel_reservation:failed", {
      requestId,
      error: result.error,
    });
    return `I wasn't able to cancel the reservation: ${result.error}`;
  }

  log("INFO", "cancel_reservation:success", {
    requestId,
    reservationId: match.id,
  });

  return `The reservation for ${guestName} on ${date} at ${match.reservationTime} has been cancelled. Is there anything else I can help with?`;
}

async function handleGetReservations(
  venueId: string,
  args: Record<string, unknown>,
  requestId: string
): Promise<string> {
  const guestName = args.guest_name as string;
  const date = args.date as string;

  log("INFO", "get_reservations:params", {
    requestId,
    venueId,
    guestName,
    date,
  });

  const reservations = await getReservationsForDate(supabase, venueId, date);

  if (!reservations.success || !reservations.data) {
    log("ERROR", "get_reservations:lookup-failed", {
      requestId,
      error: reservations.error,
    });
    return "I'm unable to look up reservations right now. Please try again.";
  }

  const matches = reservations.data.filter(
    (r) =>
      r.guestName.toLowerCase().includes(guestName.toLowerCase()) &&
      r.status !== "cancelled"
  );

  log("INFO", "get_reservations:result", {
    requestId,
    totalReservations: reservations.data.length,
    matchCount: matches.length,
    matches: matches.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      time: r.reservationTime,
      partySize: r.partySize,
      status: r.status,
    })),
  });

  if (matches.length === 0) {
    return `I don't see any reservations under ${guestName} for ${date}.`;
  }

  const details = matches
    .map(
      (r) =>
        `${r.reservationTime} - party of ${r.partySize}${r.tableIdentifier ? ` (table ${r.tableIdentifier})` : ""}, status: ${r.status}`
    )
    .join("; ");

  return `Found ${matches.length} reservation(s) for ${guestName} on ${date}: ${details}`;
}

// ============================================
// Helpers
// ============================================

async function getVenueIdByAssistant(
  assistantId?: string
): Promise<string | null> {
  if (!assistantId) return null;

  const { data, error } = await supabase
    .from("venue")
    .select("id")
    .eq("vapi_agent_id", assistantId)
    .single();

  if (error || !data) return null;
  return data.id;
}
