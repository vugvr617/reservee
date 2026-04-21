import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guest } from "../reservations/types";
import type { CreateGuestInput } from "./types";

export async function getOrCreateGuest(
  db: SupabaseClient,
  input: CreateGuestInput
): Promise<{ success: boolean; data?: Guest; error?: string }> {
  try {
    const { data: existing, error: findError } = await db
      .from("guests")
      .select("*")
      .eq("venue_id", input.venueId)
      .eq("phone_number", input.phoneNumber)
      .maybeSingle();

    if (findError) throw findError;

    if (existing) {
      if (existing.full_name !== input.fullName) {
        const { data: updated, error: updateError } = await db
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

    const { data: newGuest, error: createError } = await db
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

export async function searchGuests(
  db: SupabaseClient,
  venueId: string,
  query: string
): Promise<{ success: boolean; data?: Guest[]; error?: string }> {
  try {
    const { data, error } = await db
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

export async function getGuestsByVenue(
  db: SupabaseClient,
  venueId: string,
  options: {
    search?: string;
    vipOnly?: boolean;
    blacklistedOnly?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<{ success: boolean; data?: Guest[]; error?: string }> {
  try {
    let query = db
      .from("guests")
      .select("*")
      .eq("venue_id", venueId);

    if (options.search) {
      query = query.or(
        `full_name.ilike.%${options.search}%,phone_number.ilike.%${options.search}%`
      );
    }
    if (options.vipOnly) {
      query = query.eq("is_vip", true);
    }
    if (options.blacklistedOnly) {
      query = query.eq("is_blacklisted", true);
    }

    const sortCol = options.sortBy || "created_at";
    query = query.order(sortCol, { ascending: options.sortOrder === "asc" });

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data: data as Guest[] };
  } catch (error) {
    console.error("Error fetching guests:", error);
    return { success: false, error: "Failed to fetch guests" };
  }
}

export async function updateGuest(
  db: SupabaseClient,
  guestId: string,
  updates: {
    notes?: string | null;
    is_vip?: boolean;
    is_blacklisted?: boolean;
    email?: string | null;
  }
): Promise<{ success: boolean; data?: Guest; error?: string }> {
  try {
    const { data, error } = await db
      .from("guests")
      .update(updates)
      .eq("id", guestId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: data as Guest };
  } catch (error) {
    console.error("Error updating guest:", error);
    return { success: false, error: "Failed to update guest" };
  }
}

export async function getGuestReservations(
  db: SupabaseClient,
  guestId: string
): Promise<{ success: boolean; data?: Record<string, unknown>[]; error?: string }> {
  try {
    const { data, error } = await db
      .from("reservations")
      .select(`
        id, guest_name, party_size, reservation_date, reservation_time,
        status, special_requests, table_id, cancellation_reason,
        tables ( table_identifier ),
        floors ( floor_name )
      `)
      .eq("guest_id", guestId)
      .order("reservation_date", { ascending: false })
      .limit(50);

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error("Error fetching guest reservations:", error);
    return { success: false, error: "Failed to fetch guest reservations" };
  }
}
