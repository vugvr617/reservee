"use client";

import { useEffect, useState } from "react";
import { Settings2, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavigationSidebar } from "./NavigationSidebar";
import { FloorTabs } from "./FloorTabs";
import { FloorPlanCanvas } from "./Canvas/FloorPlanCanvas";
import { EditModeModal } from "./EditModeModal";
import { GuestListPanel } from "./GuestListPanel";
import { useCanvasStore } from "@/stores/canvas-store";
import type { Floor, TableData } from "@/modules/dashboard/types";

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
  const { setFloors, setTables, setCurrentFloor, currentFloorId, setBorders, selectTable } = useCanvasStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGuestPanelCollapsed, setIsGuestPanelCollapsed] = useState(false);

  // Initialize store with server data
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
  }, [initialFloors, initialTables, setFloors, setTables, setBorders, setCurrentFloor, currentFloorId]);

  return (
    <div className="flex h-screen w-screen bg-gray-50 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <NavigationSidebar />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header with Floor Tabs */}
        <header className="border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search Table..."
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 w-64"
            />
          </div>
        </div>
          <FloorTabs venueId={venueId} />
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Canvas Area */}
          <main className="flex-1 min-w-0 relative bg-white">
          {currentFloorId ? (
            <>
              <FloorPlanCanvas readOnly={!isEditMode} />

              {/* Action Buttons - Floating */}
              <div className="absolute top-4 right-4 flex gap-2 z-20">
                {!isEditMode && (
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
                )}
                <Button
                  onClick={() => setIsEditMode(true)}
                  className="bg-lime-500 hover:bg-lime-600 text-white gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  Edit Floor Plan
                </Button>
              </div>
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
          {!isEditMode && <GuestListPanel isCollapsed={isGuestPanelCollapsed} />}
        </div>

        {/* Edit Mode Modal */}
        <EditModeModal
          isOpen={isEditMode}
          onClose={() => {
            selectTable(null);
            setIsEditMode(false);
          }}
          venueId={venueId}
        />
      </div>
    </div>
  );
}
