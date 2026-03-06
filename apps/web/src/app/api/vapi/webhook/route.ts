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
  name: string;
  arguments: Record<string, unknown>;
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

export async function POST(request: NextRequest) {
  try {
    const body: VapiMessage = await request.json();
    const { message } = body;

    switch (message.type) {
      case "tool-calls":
        return handleToolCalls(message);

      case "status-update":
      case "end-of-call-report":
      case "transcript":
      case "hang":
        return NextResponse.json({ ok: true });

      default:
        return NextResponse.json({ ok: true });
    }
  } catch (error) {
    console.error("Vapi webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleToolCalls(message: VapiMessage["message"]) {
  const toolCalls = message.toolCallList || [];
  const assistantId = message.call?.assistantId;
  const callerPhone = message.call?.customer?.number;

  // Look up venue by assistant ID
  const venueId = await getVenueIdByAssistant(assistantId);
  if (!venueId) {
    return NextResponse.json({
      results: toolCalls.map((tc) => ({
        toolCallId: tc.id,
        result: "Sorry, I'm unable to process your request right now. Please try calling again.",
      })),
    });
  }

  const results = await Promise.all(
    toolCalls.map((tc) => executeToolCall(tc, venueId, callerPhone))
  );

  return NextResponse.json({ results });
}

async function executeToolCall(
  toolCall: ToolCall,
  venueId: string,
  callerPhone?: string
) {
  const { id, name, arguments: args } = toolCall;

  try {
    let result: string;

    switch (name) {
      case "check_availability":
        result = await handleCheckAvailability(venueId, args);
        break;

      case "create_reservation":
        result = await handleCreateReservation(venueId, args, callerPhone);
        break;

      case "modify_reservation":
        result = await handleModifyReservation(venueId, args);
        break;

      case "cancel_reservation":
        result = await handleCancelReservation(venueId, args);
        break;

      case "get_reservations":
        result = await handleGetReservations(venueId, args);
        break;

      default:
        result = `Unknown function: ${name}`;
    }

    return { toolCallId: id, result };
  } catch (error) {
    console.error(`Tool call error (${name}):`, error);
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
  args: Record<string, unknown>
): Promise<string> {
  const date = args.date as string;
  const time = args.time as string;
  const partySize = args.party_size as number;

  const result = await getAvailableTablesForSlot(
    supabase,
    venueId,
    date,
    time,
    90,
    partySize
  );

  if (!result.success || !result.data) {
    return "I'm unable to check availability right now. Please try again.";
  }

  if (result.data.length === 0) {
    return `No tables available for ${partySize} guests at ${time} on ${date}. Would you like to try a different time?`;
  }

  return `${result.data.length} table(s) available for ${partySize} guests at ${time} on ${date}. Shall I book one for you?`;
}

async function handleCreateReservation(
  venueId: string,
  args: Record<string, unknown>,
  callerPhone?: string
): Promise<string> {
  const guestName = args.guest_name as string;
  const guestPhone = (args.guest_phone as string) || callerPhone || "";
  const date = args.date as string;
  const time = args.time as string;
  const partySize = args.party_size as number;
  const specialRequests = (args.special_requests as string) || undefined;

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
    return `I wasn't able to complete the booking: ${result.error}. Would you like to try a different time?`;
  }

  const tableInfo = result.data?.tableIdentifier
    ? ` at table ${result.data.tableIdentifier}`
    : "";

  return `Reservation confirmed for ${guestName}, party of ${partySize}, on ${date} at ${time}${tableInfo}. Is there anything else I can help with?`;
}

async function handleModifyReservation(
  venueId: string,
  args: Record<string, unknown>
): Promise<string> {
  const guestName = args.guest_name as string;
  const originalDate = args.original_date as string;
  const newDate = (args.new_date as string) || undefined;
  const newTime = (args.new_time as string) || undefined;
  const newPartySize = (args.new_party_size as number) || undefined;

  // Find the existing reservation
  const reservations = await getReservationsForDate(supabase, venueId, originalDate);

  if (!reservations.success || !reservations.data) {
    return "I'm unable to look up reservations right now. Please try again.";
  }

  const match = reservations.data.find(
    (r) =>
      r.guestName.toLowerCase() === guestName.toLowerCase() &&
      r.status !== "cancelled" &&
      r.status !== "completed"
  );

  if (!match) {
    return `I couldn't find an active reservation under ${guestName} for ${originalDate}. Could you check the name or date?`;
  }

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
    return `I wasn't able to modify the reservation: ${result.error}`;
  }

  const changes: string[] = [];
  if (newDate) changes.push(`date to ${newDate}`);
  if (newTime) changes.push(`time to ${newTime}`);
  if (newPartySize) changes.push(`party size to ${newPartySize}`);

  return `Reservation for ${guestName} has been updated: ${changes.join(", ")}. The booking is now on ${updatedDate} at ${updatedTime} for ${updatedPartySize} guests.`;
}

async function handleCancelReservation(
  venueId: string,
  args: Record<string, unknown>
): Promise<string> {
  const guestName = args.guest_name as string;
  const date = args.date as string;

  // Find matching reservation
  const reservations = await getReservationsForDate(supabase, venueId, date);

  if (!reservations.success || !reservations.data) {
    return "I'm unable to look up reservations right now. Please try again.";
  }

  const match = reservations.data.find(
    (r) =>
      r.guestName.toLowerCase() === guestName.toLowerCase() &&
      r.status !== "cancelled" &&
      r.status !== "completed"
  );

  if (!match) {
    return `I couldn't find an active reservation under ${guestName} for ${date}. Could you check the name or date?`;
  }

  const result = await cancelReservation(
    supabase,
    match.id,
    "Cancelled via phone call"
  );

  if (!result.success) {
    return `I wasn't able to cancel the reservation: ${result.error}`;
  }

  return `The reservation for ${guestName} on ${date} at ${match.reservationTime} has been cancelled. Is there anything else I can help with?`;
}

async function handleGetReservations(
  venueId: string,
  args: Record<string, unknown>
): Promise<string> {
  const guestName = args.guest_name as string;
  const date = args.date as string;

  const reservations = await getReservationsForDate(supabase, venueId, date);

  if (!reservations.success || !reservations.data) {
    return "I'm unable to look up reservations right now. Please try again.";
  }

  const matches = reservations.data.filter(
    (r) =>
      r.guestName.toLowerCase().includes(guestName.toLowerCase()) &&
      r.status !== "cancelled"
  );

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
