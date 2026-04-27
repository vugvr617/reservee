import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  getAvailableTablesForSlot,
  getReservationsForDate,
  createReservation,
  updateReservation,
  cancelReservation,
} from "@/lib/domain/reservations/service";

function formatDateSpoken(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeSpoken(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  if (minutes === 0) return `${hour12} ${period}`;
  return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

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

  console.log(`\n========== [${requestId}] VAPI WEBHOOK HIT @ ${new Date().toISOString()} ==========`);

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

  console.log(`>>> [${requestId}] TOOL CALL: ${name}(${JSON.stringify(args)})`);

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
        result = await handleCheckAvailability(venueId, args, callerPhone, requestId);
        break;

      case "create_reservation":
        result = await handleCreateReservation(venueId, args, callerPhone, requestId);
        break;

      case "modify_reservation":
        result = await handleModifyReservation(venueId, args, callerPhone, requestId);
        break;

      case "cancel_reservation":
        result = await handleCancelReservation(venueId, args, callerPhone, requestId);
        break;

      case "get_reservations":
        result = await handleGetReservations(venueId, args, callerPhone, requestId);
        break;

      default:
        result = `Unknown function: ${name}`;
        log("WARN", "tool:unknown", {
          requestId,
          toolCallId: id,
          functionName: name,
        });
    }

    console.log(`<<< [${requestId}] TOOL RESULT (${Date.now() - startTime}ms): ${result.slice(0, 200)}`);

    log("INFO", `tool:${name}:success`, {
      requestId,
      toolCallId: id,
      durationMs: Date.now() - startTime,
      result,
    });

    return { toolCallId: id, result };
  } catch (error) {
    console.log(`!!! [${requestId}] TOOL ERROR (${Date.now() - startTime}ms): ${error instanceof Error ? error.message : String(error)}`);

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
  callerPhone: string | undefined,
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
    callerPhone,
  });

  let existingNote = "";
  if (callerPhone) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("reservation_time, party_size")
      .eq("venue_id", venueId)
      .eq("guest_phone", callerPhone)
      .eq("reservation_date", date)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .neq("status", "completed")
      .limit(1);

    if (existing && existing.length > 0) {
      const e = existing[0];
      existingNote = `Heads up: this caller already has a reservation on ${formatDateSpoken(date)} at ${formatTimeSpoken(e.reservation_time)} for ${e.party_size}. Acknowledge it and ask whether they'd like to modify their existing booking or add a separate additional one before proceeding. `;
      log("INFO", "check_availability:existing-found", {
        requestId,
        existingTime: e.reservation_time,
        existingPartySize: e.party_size,
      });
    }
  }

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
    return `${existingNote}No tables available for ${partySize} guests at ${formatTimeSpoken(time)} on ${formatDateSpoken(date)}. Would you like to try a different time?`;
  }

  return `${existingNote}${result.data.length} table(s) available for ${partySize} guests at ${formatTimeSpoken(time)} on ${formatDateSpoken(date)}. Shall I book one for you?`;
}

async function handleCreateReservation(
  venueId: string,
  args: Record<string, unknown>,
  callerPhone: string | undefined,
  requestId: string
): Promise<string> {
  const guestName = args.guest_name as string;
  const guestPhone = callerPhone || "";
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
    performedBy: "ai_call",
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

  return `Reservation confirmed for ${guestName}, party of ${partySize}, on ${formatDateSpoken(date)} at ${formatTimeSpoken(time)}${tableInfo}. Is there anything else I can help with?`;
}

async function handleModifyReservation(
  venueId: string,
  args: Record<string, unknown>,
  callerPhone: string | undefined,
  requestId: string
): Promise<string> {
  const originalDate = args.original_date as string;
  const newDate = (args.new_date as string) || undefined;
  const newTime = (args.new_time as string) || undefined;
  const newPartySize = (args.new_party_size as number) || undefined;

  log("INFO", "modify_reservation:params", {
    requestId,
    venueId,
    callerPhone,
    originalDate,
    newDate,
    newTime,
    newPartySize,
  });

  if (!callerPhone) {
    log("WARN", "modify_reservation:no-caller-phone", { requestId });
    return "I'm unable to identify your phone number. Please call back from the phone number used to make the reservation.";
  }

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
      guestPhone: r.guestPhone,
      status: r.status,
      time: r.reservationTime,
    })),
  });

  // Match strictly by caller's phone number
  const match = findReservationByPhone(reservations.data, callerPhone);

  if (!match) {
    log("WARN", "modify_reservation:not-found", {
      requestId,
      callerPhone,
      originalDate,
    });
    return `I couldn't find an active reservation under your phone number on ${formatDateSpoken(originalDate)}. Let me connect you with our team.`;
  }

  log("INFO", "modify_reservation:matched", {
    requestId,
    reservationId: match.id,
    currentDate: match.reservationDate,
    currentTime: match.reservationTime,
    currentPartySize: match.partySize,
  });

  const updatedDate: string = newDate || match.reservationDate;
  const updatedTime: string = newTime || match.reservationTime;
  const updatedPartySize: number = newPartySize || match.partySize;

  // Check availability for the new slot if date or time changed
  if (newDate || newTime) {
    const availability = await getAvailableTablesForSlot(
      supabase,
      venueId,
      updatedDate,
      updatedTime,
      90,
      updatedPartySize,
      match.id as string
    );

    log("INFO", "modify_reservation:availability-check", {
      requestId,
      updatedDate,
      updatedTime,
      updatedPartySize,
      availableCount: availability.data?.length ?? 0,
    });

    if (!availability.success || !availability.data || availability.data.length === 0) {
      return `No tables available for ${updatedPartySize} guests at ${formatTimeSpoken(updatedTime)} on ${formatDateSpoken(updatedDate)}. Would you like to try a different time?`;
    }
  }

  const specialRequests = (args.special_requests as string) || undefined;

  const result = await updateReservation(supabase, {
    id: match.id as string,
    venueId,
    guestName: match.guestName as string,
    guestPhone: match.guestPhone as string,
    partySize: updatedPartySize,
    reservationDate: updatedDate,
    reservationTime: updatedTime,
    tableId: match.tableId as string | null | undefined,
    specialRequests: specialRequests || (match.specialRequests as string | null) || undefined,
    performedBy: "ai_call",
  });

  if (!result.success) {
    log("ERROR", "modify_reservation:update-failed", {
      requestId,
      error: result.error,
    });
    return `I wasn't able to modify the reservation: ${result.error}`;
  }

  const changes: string[] = [];
  if (newDate) changes.push(`date to ${formatDateSpoken(newDate)}`);
  if (newTime) changes.push(`time to ${formatTimeSpoken(newTime)}`);
  if (newPartySize) changes.push(`party size to ${newPartySize}`);

  log("INFO", "modify_reservation:success", {
    requestId,
    reservationId: match.id,
    changes,
  });

  return `Reservation for ${match.guestName} has been updated: ${changes.join(", ")}. The booking is now on ${formatDateSpoken(updatedDate)} at ${formatTimeSpoken(updatedTime)} for ${updatedPartySize} guests.`;
}

async function handleCancelReservation(
  venueId: string,
  args: Record<string, unknown>,
  callerPhone: string | undefined,
  requestId: string
): Promise<string> {
  const date = args.date as string;

  log("INFO", "cancel_reservation:params", {
    requestId,
    venueId,
    callerPhone,
    date,
  });

  if (!callerPhone) {
    log("WARN", "cancel_reservation:no-caller-phone", { requestId });
    return "I'm unable to identify your phone number. Please call back from the phone number used to make the reservation.";
  }

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
      guestPhone: r.guestPhone,
      status: r.status,
    })),
  });

  // Match strictly by caller's phone number
  const match = findReservationByPhone(reservations.data, callerPhone);

  if (!match) {
    log("WARN", "cancel_reservation:not-found", {
      requestId,
      callerPhone,
      date,
    });
    return `I couldn't find an active reservation under your phone number on ${formatDateSpoken(date)}. Let me connect you with our team.`;
  }

  log("INFO", "cancel_reservation:matched", {
    requestId,
    reservationId: match.id,
    time: match.reservationTime,
  });

  const result = await cancelReservation(
    supabase,
    match.id,
    "Cancelled via phone call",
    "ai_call"
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

  return `The reservation for ${match.guestName} on ${formatDateSpoken(date)} at ${formatTimeSpoken(match.reservationTime)} has been cancelled. Is there anything else I can help with?`;
}

async function handleGetReservations(
  venueId: string,
  args: Record<string, unknown>,
  callerPhone: string | undefined,
  requestId: string
): Promise<string> {
  const date = args.date as string;

  log("INFO", "get_reservations:params", {
    requestId,
    venueId,
    callerPhone,
    date,
  });

  if (!callerPhone) {
    log("WARN", "get_reservations:no-caller-phone", { requestId });
    return "I'm unable to identify your phone number. Please call back from the phone number used to make the reservation.";
  }

  const reservations = await getReservationsForDate(supabase, venueId, date);

  if (!reservations.success || !reservations.data) {
    log("ERROR", "get_reservations:lookup-failed", {
      requestId,
      error: reservations.error,
    });
    return "I'm unable to look up reservations right now. Please try again.";
  }

  const active = reservations.data.filter((r) => r.status !== "cancelled");
  const matches = active.filter(
    (r) => normalizePhone(r.guestPhone) === normalizePhone(callerPhone)
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
    return `I don't see any reservations under your phone number on ${formatDateSpoken(date)}.`;
  }

  const details = matches
    .map(
      (r) =>
        `${formatTimeSpoken(r.reservationTime)} - party of ${r.partySize} under ${r.guestName}${r.tableIdentifier ? ` (table ${r.tableIdentifier})` : ""}, status: ${r.status}`
    )
    .join("; ");

  return `Found ${matches.length} reservation(s) on ${formatDateSpoken(date)}: ${details}`;
}

// ============================================
// Helpers
// ============================================

function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/[^0-9+]/g, "");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findReservationByPhone(
  reservations: any[],
  callerPhone?: string
) {
  if (!callerPhone) return undefined;

  const active = reservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "completed"
  );

  return active.find(
    (r) => normalizePhone(r.guestPhone) === normalizePhone(callerPhone)
  );
}

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
