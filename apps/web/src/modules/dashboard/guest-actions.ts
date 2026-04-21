"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentVenue } from "./get-current-venue";
import {
  getGuestsByVenue as _getGuestsByVenue,
  updateGuest as _updateGuest,
  getGuestReservations as _getGuestReservations,
} from "@/lib/domain/guests/service";

export async function getGuestsByVenue(options: {
  search?: string;
  vipOnly?: boolean;
  blacklistedOnly?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} = {}) {
  const venueId = await getCurrentVenue();
  return _getGuestsByVenue(supabase, venueId, options);
}

export async function updateGuest(
  guestId: string,
  updates: {
    notes?: string | null;
    is_vip?: boolean;
    is_blacklisted?: boolean;
    email?: string | null;
  }
) {
  return _updateGuest(supabase, guestId, updates);
}

export async function getGuestReservations(guestId: string) {
  return _getGuestReservations(supabase, guestId);
}
