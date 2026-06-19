import { parse, parseISO, format } from "date-fns";
import type { ReservationWithDetails } from "@/modules/dashboard/types";

// A table's live status, derived from today's reservations.
export type TableLiveStatus = "seated" | "reserved" | "overdue" | "open";

export interface TableStatusInfo {
  status: TableLiveStatus;
  // The reservation that drives the status (if any).
  reservation: ReservationWithDetails | null;
}

export interface FloorStats {
  tables: number;
  seated: number;
  reserved: number;
  open: number;
  overdue: number;
  covers: number;
}

// Reservations that no longer occupy a table.
function isInactive(r: ReservationWithDetails): boolean {
  return r.status === "cancelled" || r.status === "no_show" || r.status === "completed";
}

// Parse a reservation's start time into a Date, preferring the full datetime.
function reservationStart(r: ReservationWithDetails): Date | null {
  try {
    if (r.reservationDatetime) {
      const d = parseISO(r.reservationDatetime);
      if (!isNaN(d.getTime())) return d;
    }
  } catch {
    // fall through to time-only parse
  }
  try {
    const trimmed = r.reservationTime.length > 5 ? r.reservationTime.slice(0, 5) : r.reservationTime;
    const d = parse(`${r.reservationDate} ${trimmed}`, "yyyy-MM-dd HH:mm", new Date());
    if (!isNaN(d.getTime())) return d;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Derive a single table's live status from its reservations for the selected day.
 * `now` is the current time when the selected day is today, or null otherwise
 * (overdue only applies to "today").
 */
export function getTableStatus(
  reservations: ReservationWithDetails[],
  now: Date | null
): TableStatusInfo {
  const active = reservations.filter((r) => !isInactive(r));

  // Someone is currently seated.
  const seated = active.find((r) => r.status === "seated");
  if (seated) return { status: "seated", reservation: seated };

  // Upcoming / late reservations.
  const pending = active
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));

  if (pending.length > 0) {
    if (now) {
      const overdue = pending.filter((r) => {
        const start = reservationStart(r);
        return start ? start.getTime() < now.getTime() : false;
      });
      if (overdue.length > 0) {
        return { status: "overdue", reservation: overdue[0] };
      }
    }
    return { status: "reserved", reservation: pending[0] };
  }

  return { status: "open", reservation: null };
}

/**
 * Build a per-table status map plus aggregate floor stats.
 */
export function getFloorStatus(
  tables: { id: string }[],
  reservationsByTable: Record<string, ReservationWithDetails[]>,
  now: Date | null
): { statusByTable: Record<string, TableStatusInfo>; stats: FloorStats } {
  const statusByTable: Record<string, TableStatusInfo> = {};
  const stats: FloorStats = {
    tables: tables.length,
    seated: 0,
    reserved: 0,
    open: 0,
    overdue: 0,
    covers: 0,
  };

  for (const table of tables) {
    const info = getTableStatus(reservationsByTable[table.id] ?? [], now);
    statusByTable[table.id] = info;
    stats[info.status] += 1;
  }

  // Covers: total party size of active reservations on this floor's tables.
  const tableIds = new Set(tables.map((t) => t.id));
  for (const id of tableIds) {
    for (const r of reservationsByTable[id] ?? []) {
      if (!isInactive(r)) stats.covers += r.partySize;
    }
  }

  return { statusByTable, stats };
}

// Format "HH:mm[:ss]" into a 12-hour label like "7:30 PM".
export function formatTime12(time: string): string {
  try {
    const trimmed = time.length > 5 ? time.slice(0, 5) : time;
    const date = parse(trimmed, "HH:mm", new Date());
    return format(date, "h:mm a");
  } catch {
    return time;
  }
}
