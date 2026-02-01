"use server";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type {
  CreateFloorInput,
  UpdateFloorInput,
  CreateTableInput,
  UpdateTableInput,
  Floor,
  TableData,
} from "./types";

// Get current user's venue
async function getCurrentVenue() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { data: venue, error } = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .single();

  if (error || !venue) {
    throw new Error("Venue not found");
  }

  return venue.id;
}

// ============================================
// Floor Management
// ============================================

export async function getFloorsForVenue(venueId?: string) {
  try {
    const targetVenueId = venueId || (await getCurrentVenue());

    const { data, error } = await supabase
      .from("floors")
      .select("*")
      .eq("venue_id", targetVenueId)
      .eq("is_active", true)
      .order("floor_order", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as Floor[] };
  } catch (error) {
    console.error("Error fetching floors:", error);
    return { success: false, error: "Failed to fetch floors" };
  }
}

export async function createFloor(input: CreateFloorInput) {
  try {
    const { data, error } = await supabase
      .from("floors")
      .insert({
        venue_id: input.venueId,
        floor_name: input.floorName,
        floor_order: input.floorOrder,
        layout_config: input.layoutConfig || {
          width: 1200,
          height: 800,
          backgroundColor: "#f5f5f5",
          gridSize: 20,
          snapToGrid: true,
        },
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Floor };
  } catch (error) {
    console.error("Error creating floor:", error);
    return { success: false, error: "Failed to create floor" };
  }
}

export async function updateFloor(floorId: string, updates: UpdateFloorInput) {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.floorName !== undefined) updateData.floor_name = updates.floorName;
    if (updates.floorOrder !== undefined) updateData.floor_order = updates.floorOrder;
    if (updates.layoutConfig !== undefined) updateData.layout_config = updates.layoutConfig;

    const { data, error} = await supabase
      .from("floors")
      .update(updateData)
      .eq("id", floorId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Floor };
  } catch (error) {
    console.error("Error updating floor:", error);
    return { success: false, error: "Failed to update floor" };
  }
}

export async function deleteFloor(floorId: string) {
  try {
    // Hard delete the floor
    const { error } = await supabase
      .from("floors")
      .delete()
      .eq("id", floorId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting floor:", error);
    return { success: false, error: "Failed to delete floor" };
  }
}

export async function updateFloorBorder(
  floorId: string,
  border: { x: number; y: number; width: number; height: number } | null
) {
  try {
    // Get current layout_config
    const { data: floor, error: fetchError } = await supabase
      .from("floors")
      .select("layout_config")
      .eq("id", floorId)
      .single();

    if (fetchError) throw fetchError;

    const currentConfig = (floor?.layout_config as Record<string, unknown>) || {};
    const updatedConfig = {
      ...currentConfig,
      border,
    };

    const { data, error } = await supabase
      .from("floors")
      .update({ layout_config: updatedConfig })
      .eq("id", floorId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as Floor };
  } catch (error) {
    console.error("Error updating floor border:", error);
    return { success: false, error: "Failed to update floor border" };
  }
}

// ============================================
// Table Management
// ============================================

export async function getTablesForFloor(floorId: string) {
  try {
    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("floor_id", floorId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: data as TableData[] };
  } catch (error) {
    console.error("Error fetching tables:", error);
    return { success: false, error: "Failed to fetch tables" };
  }
}

export async function createTable(input: CreateTableInput) {
  try {
    const { data, error } = await supabase
      .from("tables")
      .insert({
        venue_id: input.venueId,
        floor_id: input.floorId,
        table_identifier: input.tableIdentifier,
        position_x: input.positionX,
        position_y: input.positionY,
        width: input.width,
        height: input.height,
        shape: input.shape,
        rotation: input.rotation || 0,
        min_capacity: input.minCapacity,
        max_capacity: input.maxCapacity,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as TableData };
  } catch (error) {
    console.error("Error creating table:", error);
    return { success: false, error: "Failed to create table" };
  }
}

export async function updateTablePosition(tableId: string, x: number, y: number) {
  try {
    const { data, error } = await supabase
      .from("tables")
      .update({
        position_x: x,
        position_y: y,
      })
      .eq("id", tableId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as TableData };
  } catch (error) {
    console.error("Error updating table position:", error);
    return { success: false, error: "Failed to update table position" };
  }
}

export async function updateTable(tableId: string, updates: UpdateTableInput) {
  try {
    const updateData: Record<string, unknown> = {};

    if (updates.tableIdentifier !== undefined) updateData.table_identifier = updates.tableIdentifier;
    if (updates.positionX !== undefined) updateData.position_x = updates.positionX;
    if (updates.positionY !== undefined) updateData.position_y = updates.positionY;
    if (updates.width !== undefined) updateData.width = updates.width;
    if (updates.height !== undefined) updateData.height = updates.height;
    if (updates.shape !== undefined) updateData.shape = updates.shape;
    if (updates.rotation !== undefined) updateData.rotation = updates.rotation;
    if (updates.minCapacity !== undefined) updateData.min_capacity = updates.minCapacity;
    if (updates.maxCapacity !== undefined) updateData.max_capacity = updates.maxCapacity;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from("tables")
      .update(updateData)
      .eq("id", tableId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as TableData };
  } catch (error) {
    console.error("Error updating table:", error);
    return { success: false, error: "Failed to update table" };
  }
}

export async function deleteTable(tableId: string) {
  try {
    // Hard delete - remove the table completely
    const { error } = await supabase
      .from("tables")
      .delete()
      .eq("id", tableId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting table:", error);
    return { success: false, error: "Failed to delete table" };
  }
}

// ============================================
// Table Status (Real-time)
// ============================================

export async function getTableStatusForFloor(floorId: string) {
  try {
    const { data, error } = await supabase
      .from("table_status_view")
      .select("*")
      .eq("floor_id", floorId);

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching table status:", error);
    return { success: false, error: "Failed to fetch table status" };
  }
}
