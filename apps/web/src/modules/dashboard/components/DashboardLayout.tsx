"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { NavigationSidebar } from "./NavigationSidebar";
import { FloorTabs } from "./FloorTabs";
import { FloorPlanCanvas } from "./Canvas/FloorPlanCanvas";
import { FloorPlanView } from "./FloorPlanView";
import { FloorStatsBar } from "./FloorStatsBar";
import { EditModeModal } from "./EditModeModal";
import { GuestListPanel } from "./GuestListPanel";
import { TableReservationPopup } from "./TableReservationPopup";
import { WalkInDialog } from "./WalkInDialog";
import { useCanvasStore } from "@/stores/canvas-store";
import { useReservationsForDate, useCreateWalkIn, useUpdateReservationStatus } from "../hooks/use-reservations";
import { getFloorStatus } from "../utils/table-status";
import { toast } from "sonner";
import type { Floor, TableData, CanvasTable, ReservationWithDetails } from "@/modules/dashboard/types";

interface DashboardLayoutProps {
  venueId: string;
  initialFloors: Floor[];
  initialTables: TableData[];
}

export function DashboardLayout({
  venueId,
  initialFloors,
  initialTables,
}: DashboardLayoutProps) {
  const { setFloors, setTables, setCurrentFloor, currentFloorId, setBorders, selectTable, tables } = useCanvasStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGuestPanelCollapsed, setIsGuestPanelCollapsed] = useState(false);
  const [popupTable, setPopupTable] = useState<{
    id: string;
    screenPos: { x: number; y: number };
    name: string;
  } | null>(null);
  const [externalDetailReservation, setExternalDetailReservation] = useState<ReservationWithDetails | null>(null);
  const [externalCreateForTableId, setExternalCreateForTableId] = useState<string | null>(null);
  const [walkInTarget, setWalkInTarget] = useState<{
    id: string;
    name: string;
    maxCapacity: number | null;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Tick the clock every minute so "overdue" status and stats stay current.
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch reservations for the selected date — drives table status AND the guest list panel
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = dateStr === format(now, "yyyy-MM-dd");
  const { data: selectedDateReservations = [] } = useReservationsForDate(venueId, dateStr);

  // Walk-in mutations
  const walkInMutation = useCreateWalkIn(venueId);
  const statusMutation = useUpdateReservationStatus(venueId, dateStr);

  const handleSeatWalkIn = (tableId: string) => {
    const table = tables.find((t: { id: string; table_identifier: string; max_capacity?: number | null }) => t.id === tableId);
    setPopupTable(null);
    setWalkInTarget({
      id: tableId,
      name: table?.table_identifier ?? "Table",
      maxCapacity: (table?.max_capacity as number | null | undefined) ?? null,
    });
  };

  const handleConfirmWalkIn = async (input: {
    partySize: number;
    reservationDate: string;
    reservationTime: string;
  }) => {
    if (!walkInTarget) return;
    const result = await walkInMutation.mutateAsync({
      tableId: walkInTarget.id,
      partySize: input.partySize,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
    });
    if (result.success) {
      toast.success("Walk-in seated successfully");
      setWalkInTarget(null);
    } else {
      toast.error(result.error || "Failed to seat walk-in");
    }
  };

  const handleFreeTable = async (reservationId: string) => {
    const result = await statusMutation.mutateAsync({
      id: reservationId,
      status: "completed",
    });
    if (result.success) {
      toast.success("Table freed");
      setPopupTable(null);
    } else {
      toast.error("Failed to free table");
    }
  };

  // Group the selected-date reservations by table.
  const reservationsByTable = useMemo(() => {
    const map: Record<string, ReservationWithDetails[]> = {};
    for (const r of selectedDateReservations) {
      if (r.tableId) (map[r.tableId] ??= []).push(r);
    }
    return map;
  }, [selectedDateReservations]);

  // Derive each table's live status + the current floor's aggregate stats.
  const { statusByTable, stats } = useMemo(() => {
    const floorTables = tables.filter((t: CanvasTable) => t.floor_id === currentFloorId);
    return getFloorStatus(floorTables, reservationsByTable, isToday ? now : null);
  }, [tables, currentFloorId, reservationsByTable, isToday, now]);

  // Filter the selected-date reservations for the clicked table (drives the popup)
  const popupTodayReservations = useMemo(() => {
    if (!popupTable) return [];
    return selectedDateReservations.filter((r) => r.tableId === popupTable.id);
  }, [selectedDateReservations, popupTable]);

  // Handle create reservation from table popup
  const handleCreateReservation = useCallback((tableId: string) => {
    setPopupTable(null);
    setExternalCreateForTableId(tableId);
    if (isGuestPanelCollapsed) setIsGuestPanelCollapsed(false);
  }, [isGuestPanelCollapsed]);

  // Handle reservation click from table popup
  const handlePopupReservationClick = useCallback((reservation: ReservationWithDetails) => {
    setPopupTable(null);
    setExternalDetailReservation(reservation);
  }, []);

  // Handle table click from canvas
  const handleTableClick = useCallback(
    (tableId: string | null, screenPos: { x: number; y: number }) => {
      if (!tableId) {
        setPopupTable(null);
        return;
      }
      const table = tables.find((t: { id: string; table_identifier: string }) => t.id === tableId);
      setPopupTable({
        id: tableId,
        screenPos,
        name: table?.table_identifier ?? "Table",
      });
    },
    [tables]
  );

  // Initialize store with server data only once on mount
  useEffect(() => {
    setFloors(initialFloors);
    setTables(initialTables);

    // Load borders from layout_config
    const loadedBorders = initialFloors
      .filter((floor) => {
        const config = floor.layout_config as { border?: unknown } | null;
        return config && typeof config === 'object' && 'border' in config && config.border;
      })
      .map((floor) => {
        const config = floor.layout_config as {
          border: { x: number; y: number; width: number; height: number };
          zones?: Array<{ id: string; label: string; x: number; y: number; width: number; height: number; color?: string }>;
        };
        const borderConfig = config.border;

        return {
          id: `border-${floor.id}`,
          floorId: floor.id,
          x: borderConfig.x,
          y: borderConfig.y,
          width: borderConfig.width,
          height: borderConfig.height,
          strokeColor: "#374151",
          strokeWidth: 4,
          zones: config.zones,
        };
      });
    setBorders(loadedBorders);

    // Set first floor as active if none selected
    if (!currentFloorId && initialFloors.length > 0) {
      setCurrentFloor(initialFloors[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <NavigationSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header with Floor Tabs */}
        <header className="border-b border-gray-200 bg-white">
          <FloorTabs venueId={venueId} onEditClick={() => setIsEditMode(true)} />
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Canvas Area */}
          <main className="flex flex-1 min-w-0 flex-col relative bg-white">
          {currentFloorId ? (
            <>
              {/* Today's stats bar (read-only view only) */}
              {!isEditMode && <FloorStatsBar stats={stats} isToday={isToday} />}

              <div className="relative flex-1 min-h-0">
                {isEditMode ? (
                  <FloorPlanCanvas readOnly={false} />
                ) : (
                  <FloorPlanView statusByTable={statusByTable} onTableClick={handleTableClick} />
                )}

                {/* Table Reservation Popup */}
                {!isEditMode && popupTable && (
                  <TableReservationPopup
                    tableId={popupTable.id}
                    tableName={popupTable.name}
                    screenPos={popupTable.screenPos}
                    todayReservations={popupTodayReservations}
                    onClose={() => setPopupTable(null)}
                    onReservationClick={handlePopupReservationClick}
                    onCreateReservation={handleCreateReservation}
                    onSeatWalkIn={handleSeatWalkIn}
                    onFreeTable={handleFreeTable}
                    isSeatingWalkIn={walkInMutation.isPending}
                    isFreeingTable={statusMutation.isPending}
                  />
                )}

                {/* Panel Toggle Button - Floating */}
                {!isEditMode && (
                  <div className="absolute top-4 right-4 z-20">
                    <Button
                      onClick={() => setIsGuestPanelCollapsed(!isGuestPanelCollapsed)}
                      variant="outline"
                      size="icon"
                      className="bg-white hover:bg-gray-50"
                    >
                      {isGuestPanelCollapsed ? (
                        <PanelRightOpen className="h-4 w-4" />
                      ) : (
                        <PanelRightClose className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Walk-in Dialog */}
              <WalkInDialog
                open={!!walkInTarget}
                onOpenChange={(open) => {
                  if (!open) setWalkInTarget(null);
                }}
                tableName={walkInTarget?.name ?? ""}
                tableMaxCapacity={walkInTarget?.maxCapacity ?? null}
                isSubmitting={walkInMutation.isPending}
                onSubmit={handleConfirmWalkIn}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium">No floor selected</p>
                <p className="text-sm mt-2">Create a floor to get started</p>
              </div>
            </div>
          )}
          </main>

          {/* Guest List Panel */}
          {!isEditMode && (
            <GuestListPanel
              isCollapsed={isGuestPanelCollapsed}
              venueId={venueId}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              externalDetailReservation={externalDetailReservation}
              onExternalDetailConsumed={() => setExternalDetailReservation(null)}
              externalCreateForTableId={externalCreateForTableId}
              onExternalCreateConsumed={() => setExternalCreateForTableId(null)}
            />
          )}
        </div>

        {/* Edit Mode Modal */}
        <EditModeModal
          isOpen={isEditMode}
          onClose={() => {
            selectTable(null);
            setPopupTable(null);
            setIsEditMode(false);
          }}
          venueId={venueId}
        />
      </div>
    </div>
  );
}
