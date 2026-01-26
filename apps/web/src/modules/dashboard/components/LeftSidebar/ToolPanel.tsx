"use client";

import { MousePointer2, Hand, Square, Circle, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/stores/canvas-store";
import type { Tool, TableShape, WallType } from "@/modules/dashboard/types";

const TOOLS: Array<{ id: Tool; icon: typeof MousePointer2; label: string }> = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "pan", icon: Hand, label: "Pan" },
  { id: "border", icon: Square, label: "Draw Border" },
  { id: "wall", icon: Minus, label: "Draw Wall" },
];

const TABLE_SHAPES: Array<{
  id: TableShape;
  icon: typeof Square;
  label: string;
}> = [
  { id: "square", icon: Square, label: "Square Table" },
  { id: "round", icon: Circle, label: "Round Table" },
  { id: "rectangular", icon: Square, label: "Rectangular Table" },
  { id: "oval", icon: Circle, label: "Oval Table" },
];

const WALL_TYPES: Array<{
  id: WallType;
  label: string;
  color: string;
}> = [
  { id: "external", label: "External Wall", color: "#374151" },
  { id: "internal", label: "Internal Wall", color: "#9ca3af" },
  { id: "fence", label: "Fence", color: "#d1d5db" },
];

export function ToolPanel() {
  const {
    currentTool,
    setCurrentTool,
    tableShape,
    setTableShape,
    currentWallType,
    setCurrentWallType,
    snapToGrid,
    setSnapToGrid,
    tables,
    walls,
    borders,
    currentFloorId,
  } = useCanvasStore();

  const hasWalls = walls.length > 0;
  const hasBorder = borders.some((b) => b.floorId === currentFloorId);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Tools Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Tools</h3>

        {/* No Border Warning */}
        {!hasBorder && (
          <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
            <strong>Start here:</strong> Draw a border rectangle to define your floor size
          </div>
        )}

        <div className="flex flex-col gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            return (
              <Button
                key={tool.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentTool(tool.id)}
                className={`justify-start gap-2 ${
                  isActive ? "bg-lime-500 text-white hover:bg-lime-600" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {tool.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Wall Types Section - Only show when wall tool is active */}
      {currentTool === "wall" && (
        <>
          <div className="h-px bg-gray-200" />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Wall Type</h3>
            <div className="flex flex-col gap-2">
              {WALL_TYPES.map((wallType) => {
                const isActive = currentWallType === wallType.id;
                return (
                  <Button
                    key={wallType.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentWallType(wallType.id)}
                    className={`justify-start gap-2 ${
                      isActive ? "bg-lime-500 text-white hover:bg-lime-600" : ""
                    }`}
                  >
                    <div
                      className="h-4 w-8 rounded border border-gray-300"
                      style={{ backgroundColor: wallType.color }}
                    />
                    {wallType.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Divider */}
      <div className="h-px bg-gray-200" />

      {/* Table Shapes Section - Only show if border exists */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Table Shapes</h3>
        {!hasBorder ? (
          <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            Please draw a floor border first before adding tables
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {TABLE_SHAPES.map((shape) => {
              const Icon = shape.icon;
              const isActive = tableShape === shape.id && currentTool === "table";
              return (
                <Button
                  key={shape.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setTableShape(shape.id);
                    setCurrentTool("table");
                  }}
                  className={`justify-start gap-2 ${
                    isActive ? "bg-lime-500 text-white hover:bg-lime-600" : ""
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {shape.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid Settings Section */}
      <div className="h-px bg-gray-200" />
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Grid Settings</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-lime-500 focus:ring-lime-500"
            />
            Snap to Grid
          </label>
        </div>
      </div>
    </div>
  );
}
