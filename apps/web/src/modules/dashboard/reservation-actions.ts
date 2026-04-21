"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentVenue, getCurrentPerformer } from "./get-current-venue";
import {
  createReservation as _createReservation,
  createWalkIn as _createWalkIn,
  updateWalkIn as _updateWalkIn,
  updateReservation as _updateReservation,
  updateReservationStatus as _updateReservationStatus,
  cancelReservation as _cancelReservation,
  deleteReservation as _deleteReservation,
  getReservationsForDate as _getReservationsForDate,
  getReservationCountsByDateRange as _getReservationCountsByDateRange,
  getUpcomingReservationsForTable as _getUpcomingReservationsForTable,
  checkTableAvailability as _checkTableAvailability,
  getAvailableTablesForSlot as _getAvailableTablesForSlot,
  getAllTablesGroupedByFloor as _getAllTablesGroupedByFloor,
  type CreateWalkInInput,
  type UpdateWalkInInput,
} from "@/lib/domain/reservations/service";
import { getOrCreateGuest as _getOrCreateGuest, searchGuests as _searchGuests } from "@/lib/domain/guests/service";
import type {
  CreateReservationInput,
  UpdateReservationInput,
  ReservationStatus,
} from "@/lib/domain/reservations/types";
import type { CreateGuestInput } from "@/lib/domain/guests/types";

// ============================================
// Guest Actions
// ============================================

export async function getOrCreateGuest(input: CreateGuestInput) {
  return _getOrCreateGuest(supabase, input);
}

export async function searchGuests(query: string) {
  const venueId = await getCurrentVenue();
  return _searchGuests(supabase, venueId, query);
}

// ============================================
// Reservation Actions
// ============================================

export async function createReservation(input: CreateReservationInput) {
  const performedBy = await getCurrentPerformer();
  return _createReservation(supabase, { ...input, performedBy });
}

export async function createWalkIn(input: CreateWalkInInput) {
  return _createWalkIn(supabase, input);
}

export async function updateWalkIn(input: UpdateWalkInInput) {
  return _updateWalkIn(supabase, input);
}

export async function updateReservation(input: UpdateReservationInput) {
  const performedBy = await getCurrentPerformer();
  return _updateReservation(supabase, { ...input, performedBy });
}

export async function getReservationsForDate(venueId: string, date: string) {
  return _getReservationsForDate(supabase, venueId, date);
}

export async function getReservationCountsByDateRange(
  venueId: string,
  startDate: string,
  endDate: string
) {
  return _getReservationCountsByDateRange(supabase, venueId, startDate, endDate);
}

export async function updateReservationStatus(
  reservationId: string,
  newStatus: ReservationStatus,
  cancellationReason?: string
) {
  const performedBy = await getCurrentPerformer();
  return _updateReservationStatus(supabase, reservationId, newStatus, cancellationReason, performedBy);
}

export async function cancelReservation(reservationId: string, reason?: string) {
  const performedBy = await getCurrentPerformer();
  return _cancelReservation(supabase, reservationId, reason, performedBy);
}

export async function deleteReservation(reservationId: string) {
  return _deleteReservation(supabase, reservationId);
}

// ============================================
// Table-specific Reservations
// ============================================

export async function getUpcomingReservationsForTable(
  tableId: string,
  fromDate: string
) {
  return _getUpcomingReservationsForTable(supabase, tableId, fromDate);
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
) {
  return _checkTableAvailability(supabase, tableId, date, time, durationMinutes, excludeReservationId);
}

export async function getAvailableTablesForSlot(
  venueId: string,
  date: string,
  time: string,
  durationMinutes: number,
  partySize?: number,
  excludeReservationId?: string
) {
  return _getAvailableTablesForSlot(supabase, venueId, date, time, durationMinutes, partySize, excludeReservationId);
}

export async function getAllTablesGroupedByFloor(venueId: string) {
  return _getAllTablesGroupedByFloor(supabase, venueId);
}
