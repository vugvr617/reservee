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

