import type { Tables } from "@/../../packages/database/src/types";

export type Guest = Tables<"guests">;
export type Reservation = Tables<"reservations">;

export type ReservationStatus =
  | "pending"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export type ReservationDisplayStatus =
  | "upcoming"
  | "seated"
  | "completed"
  | "cancelled";

export interface ReservationWithDetails {
  id: string;
  guestName: string;
  guestPhone: string;
  guestId: string | null;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  reservationDatetime: string;
  durationMinutes: number | null;
  status: ReservationStatus;
  specialRequests: string | null;
  internalNotes: string | null;
  tableId: string | null;
  floorId: string | null;
  tableIdentifier: string | null;
  floorName: string | null;
  tableMaxCapacity: number | null;
  createdAt: string;
  seatedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  isWalkIn: boolean;
}

export interface CreateReservationInput {
  venueId: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  tableId?: string | null;
  floorId?: string | null;
  durationMinutes?: number;
  specialRequests?: string;
  performedBy?: string;
}

export interface UpdateReservationInput {
  id: string;
  venueId: string;
  guestName: string;
  guestPhone: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  tableId?: string | null;
  floorId?: string | null;
  durationMinutes?: number;
  specialRequests?: string;
  performedBy?: string;
}

export interface TableOption {
  id: string;
  tableIdentifier: string;
  minCapacity: number;
  maxCapacity: number;
  floorId: string;
  floorName: string;
}
