"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentVenue } from "./get-current-venue";
import { createReservationSchema } from "./schemas";
import type {
  Guest,
  Reservation,
  ReservationWithDetails,
  ReservationStatus,
  CreateReservationInput,
  UpdateReservationInput,
  CreateGuestInput,
  TableOption,
} from "./types";

// ============================================
// Guest Actions
// ============================================

export async function getOrCreateGuest(input: CreateGuestInput): Promise<{
  success: boolean;
  data?: Guest;
  error?: string;
}> {
  try {
    // Try to find existing guest by phone + venue
    const { data: existing, error: findError } = await supabase
      .from("guests")
      .select("*")
      .eq("venue_id", input.venueId)
      .eq("phone_number", input.phoneNumber)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      // Update name if it changed
      if (existing.full_name !== input.fullName) {
        const { data: updated, error: updateError } = await supabase
          .from("guests")
          .update({ full_name: input.fullName })
          .eq("id", existing.id)
          .select()
          .single();
        if (updateError) throw updateError;
        return { success: true, data: updated as Guest };
      }
      return { success: true, data: existing as Guest };
    }

    // Create new guest
    const { data: newGuest, error: createError } = await supabase
      .from("guests")
      .insert({
        venue_id: input.venueId,
        full_name: input.fullName,
        phone_number: input.phoneNumber,
        email: input.email || null,
      })
      .select()
      .single();

    if (createError) throw createError;
    return { success: true, data: newGuest as Guest };
  } catch (error) {
    console.error("Error in getOrCreateGuest:", error);
    return { success: false, error: "Failed to find or create guest" };
  }
}

export async function searchGuests(query: string): Promise<{
  success: boolean;
  data?: Guest[];
  error?: string;
}> {
  try {
    const venueId = await getCurrentVenue();

    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("venue_id", venueId)
      .or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return { success: true, data: data as Guest[] };
  } catch (error) {
    console.error("Error searching guests:", error);
    return { success: false, error: "Failed to search guests" };
  }
}

// ============================================
// Reservation Actions
// ============================================

export async function createReservation(input: CreateReservationInput): Promise<{
  success: boolean;
  data?: ReservationWithDetails;
  error?: string;
}> {
  try {
    // Validate input with Zod
    const validation = createReservationSchema.safeParse({
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      partySize: input.partySize,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      tableId: input.tableId,
      specialRequests: input.specialRequests,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Get or create guest
    const guestResult = await getOrCreateGuest({
      venueId: input.venueId,
      fullName: input.guestName,
      phoneNumber: input.guestPhone,
    });
    if (!guestResult.success || !guestResult.data) {
      return { success: false, error: guestResult.error || "Failed to resolve guest" };
    }
    const guest = guestResult.data;

    // Check for double-booking if table is specified
    if (input.tableId) {
      const conflictCheck = await checkTableAvailability(
        input.tableId,
        input.reservationDate,
        input.reservationTime,
        input.durationMinutes || 90
      );
      if (!conflictCheck.available) {
        return { success: false, error: conflictCheck.reason || "Table is not available at this time" };
      }
    }

    // Derive floorId from tableId if not provided
    let floorId = input.floorId || null;
    if (input.tableId && !floorId) {
      const { data: table } = await supabase
        .from("tables")
        .select("floor_id")
        .eq("id", input.tableId)
        .single();
      floorId = table?.floor_id || null;
    }

    // Build reservation_datetime
    const reservationDatetime = `${input.reservationDate}T${input.reservationTime}:00`;

    // Insert reservation
    const { data, error } = await supabase
      .from("reservations")
      .insert({
        venue_id: input.venueId,
        guest_id: guest.id,
        guest_name: input.guestName,
        guest_phone: input.guestPhone,
        party_size: input.partySize,
        reservation_date: input.reservationDate,
        reservation_time: input.reservationTime,
        reservation_datetime: reservationDatetime,
        duration_minutes: input.durationMinutes || 90,
        table_id: input.tableId || null,
        floor_id: floorId,
        special_requests: input.specialRequests || null,
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .select(`
        *,
        tables ( table_identifier, max_capacity ),
        floors ( floor_name )
      `)
      .single();

    if (error) throw error;

    // Increment guest's total_reservations
    await supabase
      .from("guests")
      .update({
        total_reservations: (guest.total_reservations || 0) + 1,
      })
      .eq("id", guest.id);

    return { success: true, data: mapReservationRow(data) };
  } catch (error: unknown) {
    console.error("Error creating reservation:", error);
    const pgCode = (error as { code?: string })?.code;
    const pgMessage = (error as { message?: string })?.message || "";

    if (pgCode === "23514") {
      if (pgMessage.includes("reservations_check")) {
        return { success: false, error: "Reservation date & time must be in the future" };
      }
      if (pgMessage.includes("party_size")) {
        return { success: false, error: "Party size must be at least 1" };
      }
      if (pgMessage.includes("duration_minutes")) {
        return { success: false, error: "Duration must be greater than 0" };
      }
      if (pgMessage.includes("status_check")) {
        return { success: false, error: "Invalid reservation status" };
      }
    }

    return { success: false, error: "Failed to create reservation" };
  }
}

// ============================================
// Walk-In Actions
// ============================================

export async function createWalkIn(
  venueId: string,
  tableId: string
): Promise<{ success: boolean; data?: ReservationWithDetails; error?: string }> {
  try {
    // Derive floorId from table
    const { data: table } = await supabase
      .from("tables")
      .select("floor_id")
      .eq("id", tableId)
      .single();

    const floorId = table?.floor_id || null;

    // Build "now" values
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const reservationDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const reservationTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const reservationDatetime = `${reservationDate}T${reservationTime}:00`;

    const { data, error } = await supabase
      .from("reservations")
      .insert({
        venue_id: venueId,
        guest_id: null,
        guest_name: "Walk-in",
        guest_phone: "",
        party_size: 1,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        reservation_datetime: reservationDatetime,
        duration_minutes: 90,
        table_id: tableId,
        floor_id: floorId,
        status: "seated",
        is_walk_in: true,
        seated_at: now.toISOString(),
      })
      .select(`
        *,
        tables ( table_identifier, max_capacity ),
        floors ( floor_name )
      `)
      .single();

    if (error) throw error;

    return { success: true, data: mapReservationRow(data) };
  } catch (error: unknown) {
    console.error("Error creating walk-in:", error);
    return { success: false, error: "Failed to seat walk-in" };
  }
}

export async function updateReservation(input: UpdateReservationInput): Promise<{
  success: boolean;
  data?: ReservationWithDetails;
  error?: string;
}> {
  try {
    // Validate input with the same schema as create
    const validation = createReservationSchema.safeParse({
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      partySize: input.partySize,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      tableId: input.tableId,
      specialRequests: input.specialRequests,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // Get or create guest (handles name/phone changes)
    const guestResult = await getOrCreateGuest({
      venueId: input.venueId,
      fullName: input.guestName,
      phoneNumber: input.guestPhone,
    });
    if (!guestResult.success || !guestResult.data) {
      return { success: false, error: guestResult.error || "Failed to resolve guest" };
    }
    const guest = guestResult.data;

    // Check table availability if table is specified (exclude current reservation)
    if (input.tableId) {
      const conflictCheck = await checkTableAvailability(
        input.tableId,
        input.reservationDate,
        input.reservationTime,
        input.durationMinutes || 90,
        input.id
      );
      if (!conflictCheck.available) {
        return { success: false, error: conflictCheck.reason || "Table is not available at this time" };
      }
    }

    // Derive floorId from tableId if not provided
    let floorId = input.floorId || null;
    if (input.tableId && !floorId) {
      const { data: table } = await supabase
        .from("tables")
        .select("floor_id")
        .eq("id", input.tableId)
        .single();
      floorId = table?.floor_id || null;
    }

    // Build reservation_datetime
    const reservationDatetime = `${input.reservationDate}T${input.reservationTime}:00`;

    // Update reservation
    const { data, error } = await supabase
      .from("reservations")
      .update({
        guest_id: guest.id,
        guest_name: input.guestName,
        guest_phone: input.guestPhone,
        party_size: input.partySize,
        reservation_date: input.reservationDate,
        reservation_time: input.reservationTime,
        reservation_datetime: reservationDatetime,
        duration_minutes: input.durationMinutes || 90,
        table_id: input.tableId || null,
        floor_id: floorId,
        special_requests: input.specialRequests || null,
      })
      .eq("id", input.id)
      .select(`
        *,
        tables ( table_identifier, max_capacity ),
        floors ( floor_name )
      `)
      .single();

    if (error) throw error;

    return { success: true, data: mapReservationRow(data) };
  } catch (error: unknown) {
    console.error("Error updating reservation:", error);
    const pgCode = (error as { code?: string })?.code;
    const pgMessage = (error as { message?: string })?.message || "";

    if (pgCode === "23514") {
      if (pgMessage.includes("reservations_check")) {
        return { success: false, error: "Reservation date & time must be in the future" };
      }
      if (pgMessage.includes("party_size")) {
        return { success: false, error: "Party size must be at least 1" };
      }
      if (pgMessage.includes("duration_minutes")) {
        return { success: false, error: "Duration must be greater than 0" };
      }
    }

    return { success: false, error: "Failed to update reservation" };
  }
}

export async function getReservationsForDate(
  venueId: string,
  date: string
): Promise<{
  success: boolean;
  data?: ReservationWithDetails[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        tables ( table_identifier, max_capacity ),
        floors ( floor_name )
      `)
      .eq("venue_id", venueId)
      .eq("reservation_date", date)
      .order("reservation_time", { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map(mapReservationRow);
    return { success: true, data: mapped };
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return { success: false, error: "Failed to fetch reservations" };
  }
}

export async function getReservationCountsByDateRange(
  venueId: string,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  data?: Record<string, number>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("reservation_date")
      .eq("venue_id", venueId)
      .gte("reservation_date", startDate)
      .lte("reservation_date", endDate)
      .neq("status", "cancelled");

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.reservation_date] = (counts[row.reservation_date] || 0) + 1;
    }

    return { success: true, data: counts };
  } catch (error) {
    console.error("Error fetching reservation counts:", error);
    return { success: false, error: "Failed to fetch reservation counts" };
  }
}

export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  cancellationReason?: string
): Promise<{
  success: boolean;
  data?: ReservationWithDetails;
  error?: string;
}> {
  try {
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    const now = new Date().toISOString();
    if (newStatus === "seated") {
      updateData.seated_at = now;
    } else if (newStatus === "completed") {
      updateData.completed_at = now;
    } else if (newStatus === "cancelled") {
      updateData.cancelled_at = now;
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
    } else if (newStatus === "no_show") {
      updateData.cancelled_at = now;
    } else if (newStatus === "confirmed") {
      updateData.confirmed_at = now;
    }

    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", reservationId)
      .select(`
        *,
        tables ( table_identifier, max_capacity ),
        floors ( floor_name )
      `)
      .single();

    if (error) throw error;

    // Update guest stats based on status change
    if (newStatus === "cancelled" && data) {
      const { data: guest } = await supabase
        .from("guests")
        .select("total_cancellations")
        .eq("id", data.guest_id)
        .single();
      if (guest) {
        await supabase
          .from("guests")
          .update({ total_cancellations: (guest.total_cancellations || 0) + 1 })
          .eq("id", data.guest_id);
      }
    }

    if (newStatus === "no_show" && data) {
      const { data: guest } = await supabase
        .from("guests")
        .select("total_no_shows")
        .eq("id", data.guest_id)
        .single();
      if (guest) {
        await supabase
          .from("guests")
          .update({ total_no_shows: (guest.total_no_shows || 0) + 1 })
          .eq("id", data.guest_id);
      }
    }

    if (newStatus === "completed" && data) {
      await supabase
        .from("guests")
        .update({ last_visit_date: data.reservation_date })
        .eq("id", data.guest_id);
    }

    return { success: true, data: mapReservationRow(data) };
  } catch (error) {
    console.error("Error updating reservation status:", error);
    return { success: false, error: "Failed to update reservation status" };
  }
}

export async function cancelReservation(
  reservationId: string,
  reason?: string
): Promise<{ success: boolean; data?: ReservationWithDetails; error?: string }> {
  return updateReservationStatus(reservationId, "cancelled", reason);
}

export async function deleteReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", reservationId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting reservation:", error);
    return { success: false, error: "Failed to delete reservation" };
  }
}

// ============================================
// Table-specific Reservations
// ============================================

export async function getUpcomingReservationsForTable(
  tableId: string,
  fromDate: string
): Promise<{
  success: boolean;
  data?: ReservationWithDetails[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        tables ( table_identifier, max_capacity ),
        floors ( floor_name )
      `)
      .eq("table_id", tableId)
      .gt("reservation_date", fromDate)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .neq("status", "completed")
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true })
      .limit(20);

    if (error) throw error;

    const mapped = (data || []).map(mapReservationRow);
    return { success: true, data: mapped };
  } catch (error) {
    console.error("Error fetching upcoming reservations for table:", error);
    return { success: false, error: "Failed to fetch upcoming reservations" };
  }
}

// ============================================
// Table Availability
// ============================================

export async function checkTableAvailability(
  tableId: string,
  date: string,
  time: string,
  durationMinutes: number,
  excludeReservationId?: string
): Promise<{
  available: boolean;
  reason?: string;
}> {
  try {
    const requestedStartMin = timeToMinutes(time);
    const requestedEndMin = requestedStartMin + durationMinutes;

    let query = supabase
      .from("reservations")
      .select("id, guest_name, reservation_time, reservation_datetime, duration_minutes")
      .eq("table_id", tableId)
      .eq("reservation_date", date)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .neq("status", "completed");

    if (excludeReservationId) {
      query = query.neq("id", excludeReservationId);
    }

    const { data: existingReservations, error } = await query;

    if (error) throw error;

    for (const existing of existingReservations || []) {
      const existingStartMin = datetimeToMinutes(existing.reservation_datetime);
      const existingDuration = existing.duration_minutes || 90;
      const existingEndMin = existingStartMin + existingDuration;

      if (rangesOverlap(requestedStartMin, requestedEndMin, existingStartMin, existingEndMin)) {
        return {
          available: false,
          reason: `Table is reserved by ${existing.guest_name} at ${existing.reservation_time}`,
        };
      }
    }

    return { available: true };
  } catch (error) {
    console.error("Error checking table availability:", error);
    return { available: false, reason: "Failed to check availability" };
  }
}

export async function getAvailableTablesForSlot(
  venueId: string,
  date: string,
  time: string,
  durationMinutes: number,
  partySize?: number,
  excludeReservationId?: string
): Promise<{
  success: boolean;
  data?: TableOption[];
  error?: string;
}> {
  try {
    // Get all active tables with floor info
    const { data: tables, error: tablesError } = await supabase
      .from("tables")
      .select(`
        id, table_identifier, min_capacity, max_capacity, floor_id,
        floors ( floor_name )
      `)
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .order("table_identifier", { ascending: true });

    if (tablesError) throw tablesError;

    // Get active reservations for this date
    const requestedStartMin = timeToMinutes(time);
    const requestedEndMin = requestedStartMin + durationMinutes;

    let resQuery = supabase
      .from("reservations")
      .select("table_id, reservation_datetime, duration_minutes, id")
      .eq("venue_id", venueId)
      .eq("reservation_date", date)
      .neq("status", "cancelled")
      .neq("status", "no_show")
      .neq("status", "completed")
      .not("table_id", "is", null);

    if (excludeReservationId) {
      resQuery = resQuery.neq("id", excludeReservationId);
    }

    const { data: reservations, error: resError } = await resQuery;

    if (resError) throw resError;

    // Build set of occupied table IDs
    const occupiedTableIds = new Set<string>();
    for (const r of reservations || []) {
      if (!r.table_id) continue;
      const existingStartMin = datetimeToMinutes(r.reservation_datetime);
      const existingEndMin = existingStartMin + (r.duration_minutes || 90);
      if (rangesOverlap(requestedStartMin, requestedEndMin, existingStartMin, existingEndMin)) {
        occupiedTableIds.add(r.table_id);
      }
    }

    // Filter and map tables
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const available: TableOption[] = (tables || [])
      .filter((t: any) => {
        if (occupiedTableIds.has(t.id)) return false;
        if (partySize && t.max_capacity < partySize) return false;
        return true;
      })
      .map((t: any) => ({
        id: t.id,
        tableIdentifier: t.table_identifier,
        minCapacity: t.min_capacity,
        maxCapacity: t.max_capacity,
        floorId: t.floor_id,
        floorName: (t.floors as { floor_name: string })?.floor_name || "Unknown Floor",
      }));

    return { success: true, data: available };
  } catch (error) {
    console.error("Error getting available tables:", error);
    return { success: false, error: "Failed to get available tables" };
  }
}

export async function getAllTablesGroupedByFloor(
  venueId: string
): Promise<{
  success: boolean;
  data?: TableOption[];
  error?: string;
}> {
  try {
    const { data: tables, error } = await supabase
      .from("tables")
      .select(`
        id, table_identifier, min_capacity, max_capacity, floor_id,
        floors ( floor_name )
      `)
      .eq("venue_id", venueId)
      .eq("is_active", true)
      .order("table_identifier", { ascending: true });

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: TableOption[] = (tables || []).map((t: any) => ({
      id: t.id,
      tableIdentifier: t.table_identifier,
      minCapacity: t.min_capacity,
      maxCapacity: t.max_capacity,
      floorId: t.floor_id,
      floorName: (t.floors as { floor_name: string })?.floor_name || "Unknown Floor",
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Error fetching all tables:", error);
    return { success: false, error: "Failed to fetch tables" };
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Convert "HH:MM" to minutes since midnight. Pure integer math — no timezone dependency.
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Extract minutes since midnight from a "YYYY-MM-DDTHH:MM:SS" datetime string.
 * Works by slicing the time portion — never constructs a Date object.
 */
function datetimeToMinutes(datetime: string): number {
  // datetime format: "2026-03-01T19:30:00"
  const timePart = datetime.split("T")[1] ?? "00:00";
  return timeToMinutes(timePart);
}

/**
 * Check if two time ranges on the same day overlap using minute-based math.
 */
function rangesOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && endA > startB;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReservationRow(r: any): ReservationWithDetails {
  return {
    id: r.id,
    guestName: r.guest_name,
    guestPhone: r.guest_phone,
    guestId: r.guest_id,
    partySize: r.party_size,
    reservationDate: r.reservation_date,
    reservationTime: r.reservation_time,
    reservationDatetime: r.reservation_datetime,
    durationMinutes: r.duration_minutes,
    status: r.status as ReservationStatus,
    specialRequests: r.special_requests,
    internalNotes: r.internal_notes,
    tableId: r.table_id,
    floorId: r.floor_id,
    tableIdentifier: r.tables?.table_identifier || null,
    floorName: r.floors?.floor_name || null,
    tableMaxCapacity: r.tables?.max_capacity || null,
    createdAt: r.created_at,
    seatedAt: r.seated_at,
    completedAt: r.completed_at,
    cancelledAt: r.cancelled_at,
    cancellationReason: r.cancellation_reason,
    isWalkIn: r.is_walk_in ?? false,
  };
}
