import type { Tables } from "@/../../packages/database/src/types";

export type Floor = Tables<"floors">;
export type TableData = Tables<"tables">;
export type TableStatus = Tables<"table_status_view">;

export interface CanvasTable extends TableData {
  status?: "available" | "occupied" | "reserved";
  statusColor?: string;
}

export interface CreateFloorInput {
  venueId: string;
  floorName: string;
  floorOrder: number;
  layoutConfig?: {
    width: number;
    height: number;
    backgroundColor: string;
    gridSize: number;
    snapToGrid: boolean;
  };
}

export interface UpdateFloorInput {
  floorName?: string;
  floorOrder?: number;
  layoutConfig?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    gridSize?: number;
    snapToGrid?: boolean;
  };
}

export interface CreateTableInput {
  venueId: string;
  floorId: string;
  tableIdentifier: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  shape: "square" | "round" | "rectangular" | "oval";
  rotation?: number;
  minCapacity: number;
  maxCapacity: number;
}

export interface UpdateTableInput {
  tableIdentifier?: string;
  positionX?: number;
  positionY?: number;
  width?: number;
  height?: number;
  shape?: "square" | "round" | "rectangular" | "oval";
  rotation?: number;
  minCapacity?: number;
  maxCapacity?: number;
  notes?: string;
}

// Simplified tools - no wall
export type Tool = "select" | "table" | "pan" | "border";
export type TableShape = "square" | "round" | "rectangular" | "oval";

export interface Position {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface Border {
  id: string;
  floorId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  strokeWidth: number;
  zones?: Zone[];
}

// ============================================
// Guest & Reservation Types
// ============================================

export type Guest = Tables<"guests">;
export type Reservation = Tables<"reservations">;

export type ReservationStatus =
  | "pending"
  | "confirmed"
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
  guestId: string;
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
}

export interface CreateGuestInput {
  venueId: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
}

export interface TableOption {
  id: string;
  tableIdentifier: string;
  minCapacity: number;
  maxCapacity: number;
  floorId: string;
  floorName: string;
}

