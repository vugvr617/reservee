"use client";

import { useEffect, useRef, useMemo } from "react";
import { X, CalendarDays, Loader2, UserPlus, DoorOpen } from "lucide-react";
import { format, parse, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpcomingTableReservations } from "../hooks/use-reservations";
import type { ReservationWithDetails, ReservationStatus } from "../types";

interface TableReservationPopupProps {
  tableId: string;
  tableName: string;
  screenPos: { x: number; y: number };
  todayReservations: ReservationWithDetails[];
  onClose: () => void;
  onReservationClick?: (reservation: ReservationWithDetails) => void;
  onSeatWalkIn?: (tableId: string) => void;
  onFreeTable?: (reservationId: string) => void;
  isSeatingWalkIn?: boolean;
  isFreeingTable?: boolean;
}

type DisplayStatus = "upcoming" | "seated" | "completed" | "cancelled";

function toDisplayStatus(status: ReservationStatus): DisplayStatus {
  switch (status) {
    case "pending":
    case "confirmed":
      return "upcoming";
    case "seated":
      return "seated";
    case "completed":
      return "completed";
    case "cancelled":
    case "no_show":
      return "cancelled";
  }
}

function formatTime12(time: string): string {
  try {
    const trimmed = time.length > 5 ? time.slice(0, 5) : time;
    const date = parse(trimmed, "HH:mm", new Date());
    return format(date, "h:mm a");
  } catch {
    return time;
  }
}

function StatusDot({ status }: { status: ReservationStatus }) {
  const display = toDisplayStatus(status);
  const base = "w-2.5 h-2.5 rounded-full";

  switch (display) {
    case "upcoming":
      return <div className={`${base} border-2 border-blue-500 bg-transparent`} />;
    case "seated":
      return <div className={`${base} bg-green-500`} />;
    case "completed":
      return <div className={`${base} bg-gray-400`} />;
    case "cancelled":
      return <div className={`${base} bg-red-500`} />;
  }
}

function TimelineList({
  reservations,
  onReservationClick,
}: {
  reservations: ReservationWithDetails[];
  onReservationClick?: (reservation: ReservationWithDetails) => void;
}) {
  if (reservations.length === 0) return null;

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[67.5px] top-0 bottom-0 w-px bg-gray-200" />

      {reservations.map((r) => (
        <div
          key={r.id}
          className={`relative flex items-center py-2.5 ${onReservationClick ? "cursor-pointer rounded-lg hover:bg-gray-50 transition-colors" : ""}`}
          onClick={() => onReservationClick?.(r)}
        >
          {/* Time */}
          <div className="w-[58px] shrink-0 text-right pr-1 whitespace-nowrap">
            <span className="text-[11px] font-semibold text-gray-900 tracking-tight">
              {formatTime12(r.reservationTime)}
            </span>
          </div>

          {/* Status dot on the line */}
          <div className="relative z-10 w-[18px] shrink-0 flex items-center justify-center">
            <div className="bg-white p-[3px] rounded-full">
              <StatusDot status={r.status} />
            </div>
          </div>

          {/* Guest info */}
          <div className="flex-1 min-w-0 pl-2">
            <div className="font-semibold text-gray-900 text-[12px] leading-tight truncate flex items-center gap-1.5">
              {r.guestName}
              {r.isWalkIn && (
                <span className="inline-flex items-center px-1 py-0 rounded text-[9px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 leading-tight">
                  Walk-in
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
              {r.partySize} {r.partySize === 1 ? "guest" : "guests"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableReservationPopup({
  tableId,
  tableName,
  screenPos,
  todayReservations,
  onClose,
  onReservationClick,
  onSeatWalkIn,
  onFreeTable,
  isSeatingWalkIn,
  isFreeingTable,
}: TableReservationPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const { data: upcomingReservations = [], isLoading } = useUpcomingTableReservations(tableId);

  // Group upcoming reservations by date
  const upcomingByDate = useMemo(() => {
    const groups: Record<string, ReservationWithDetails[]> = {};
    for (const r of upcomingReservations) {
      if (!groups[r.reservationDate]) {
        groups[r.reservationDate] = [];
      }
      groups[r.reservationDate].push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingReservations]);

  // Find active walk-in on this table
  const activeWalkIn = useMemo(
    () => todayReservations.find((r) => r.isWalkIn && r.status === "seated"),
    [todayReservations]
  );

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Smart positioning
  const popupWidth = 260;
  const popupMaxHeight = 420;
  const offsetY = 8;

  let left = screenPos.x - popupWidth / 2;
  let top = screenPos.y + offsetY;

  if (left + popupWidth > window.innerWidth - 16) {
    left = window.innerWidth - popupWidth - 16;
  }
  if (left < 16) left = 16;

  if (top + popupMaxHeight > window.innerHeight - 16) {
    top = screenPos.y - popupMaxHeight - offsetY;
  }

  const activeTodayReservations = todayReservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show" && r.status !== "completed"
  );

  const hasNoReservations =
    activeTodayReservations.length === 0 && upcomingReservations.length === 0 && !isLoading;

  return (
    <div
      ref={popupRef}
      className="absolute z-50"
      style={{ left, top, width: popupWidth }}
    >
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <span className="text-[13px] font-semibold text-gray-800 truncate">
            {tableName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-1 text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ScrollArea className="max-h-[320px]">
          <div className="py-2 px-2">
            {/* Today section */}
            <div className="mb-1">
              <div className="flex items-center gap-1.5 px-1.5 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                  Today
                </span>
              </div>

              {activeTodayReservations.length > 0 ? (
                <TimelineList reservations={activeTodayReservations} onReservationClick={onReservationClick} />
              ) : (
                <p className="text-[11px] text-gray-400 px-1.5 py-2">
                  No reservations today
                </p>
              )}
            </div>

            {/* Upcoming section */}
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
              </div>
            ) : upcomingByDate.length > 0 ? (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 px-1.5 mb-1">
                  <CalendarDays className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
                    Upcoming
                  </span>
                </div>

                {upcomingByDate.map(([date, reservations]) => (
                  <div key={date} className="mb-2">
                    <p className="text-[10px] font-medium text-gray-500 px-1.5 mb-0.5">
                      {format(parseISO(date), "EEE, MMM d")}
                    </p>
                    <TimelineList reservations={reservations} onReservationClick={onReservationClick} />
                  </div>
                ))}
              </div>
            ) : null}

            {/* Empty state */}
            {hasNoReservations && (
              <div className="text-center py-6">
                <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-[11px] text-gray-400">No reservations</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Walk-In / Free Table action */}
        {(onSeatWalkIn || onFreeTable) && (
          <div className="px-2.5 py-2 border-t border-gray-100">
            {activeWalkIn && onFreeTable ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 gap-1.5 text-[12px] border-gray-300 text-gray-600 hover:bg-gray-50"
                onClick={() => onFreeTable(activeWalkIn.id)}
                disabled={isFreeingTable}
              >
                {isFreeingTable ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <DoorOpen className="h-3.5 w-3.5" />
                )}
                Free Table
              </Button>
            ) : !activeWalkIn && onSeatWalkIn ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 gap-1.5 text-[12px] border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => onSeatWalkIn(tableId)}
                disabled={isSeatingWalkIn}
              >
                {isSeatingWalkIn ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                Seat Walk-In
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
