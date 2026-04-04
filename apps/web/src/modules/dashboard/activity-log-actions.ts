"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentVenue } from "./get-current-venue";

export interface AuditLogEntry {
  id: string;
  reservationId: string;
  venueId: string;
  action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
  performedBy: string | null;
  createdAt: string;
}

export interface AuditLogStats {
  totalEvents: number;
  todayEvents: number;
  aiActions: number;
  staffActions: number;
}

export async function getAuditLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  reservationId?: string;
}): Promise<{ success: boolean; data?: AuditLogEntry[]; error?: string }> {
  try {
    const venueId = await getCurrentVenue();

    let query = supabase
      .from("reservation_audit_log")
      .select("*")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (options?.action && options.action !== "all") {
      query = query.eq("action", options.action);
    }

    if (options?.performedBy && options.performedBy !== "all") {
      if (options.performedBy === "ai_call") {
        query = query.eq("performed_by", "ai_call");
      } else if (options.performedBy === "staff") {
        query = query.like("performed_by", "staff:%");
      } else if (options.performedBy === "owner") {
        query = query.like("performed_by", "owner:%");
      }
    }

    if (options?.dateFrom) {
      query = query.gte("created_at", options.dateFrom + "T00:00:00.000Z");
    }

    if (options?.dateTo) {
      query = query.lte("created_at", options.dateTo + "T23:59:59.999Z");
    }

    if (options?.reservationId) {
      query = query.eq("reservation_id", options.reservationId);
    }

    query = query.limit(options?.limit ?? 50);

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options?.limit ?? 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped: AuditLogEntry[] = (data || []).map((row) => ({
      id: row.id,
      reservationId: row.reservation_id,
      venueId: row.venue_id,
      action: row.action,
      oldValues: row.old_values as Record<string, unknown> | null,
      newValues: row.new_values as Record<string, unknown> | null,
      changedFields: row.changed_fields,
      performedBy: row.performed_by,
      createdAt: row.created_at,
    }));

    return { success: true, data: mapped };
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return { success: false, error: "Failed to fetch activity logs" };
  }
}

export async function getAuditLogStats(): Promise<{
  success: boolean;
  data?: AuditLogStats;
  error?: string;
}> {
  try {
    const venueId = await getCurrentVenue();

    const today = new Date().toISOString().split("T")[0];

    const [totalResult, todayResult, aiResult, staffResult] = await Promise.all([
      supabase
        .from("reservation_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId),
      supabase
        .from("reservation_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .gte("created_at", today + "T00:00:00.000Z"),
      supabase
        .from("reservation_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .eq("performed_by", "ai_call"),
      supabase
        .from("reservation_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("venue_id", venueId)
        .neq("performed_by", "ai_call"),
    ]);

    return {
      success: true,
      data: {
        totalEvents: totalResult.count ?? 0,
        todayEvents: todayResult.count ?? 0,
        aiActions: aiResult.count ?? 0,
        staffActions: staffResult.count ?? 0,
      },
    };
  } catch (error) {
    console.error("Error fetching audit log stats:", error);
    return { success: false, error: "Failed to fetch activity stats" };
  }
}
