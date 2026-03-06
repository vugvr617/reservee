"use client";

import { MousePointer2, Hand, Square, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/stores/canvas-store";
import type { TableShape } from "@/modules/dashboard/types";

type SimpleTool = "select" | "pan" | "border" | "table";

const TOOLS: Array<{ id: SimpleTool; icon: typeof MousePointer2; label: string; shortcut: string }> = [
  { id: "select", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "pan", icon: Hand, label: "Pan", shortcut: "H" },
  { id: "border", icon: Square, label: "Draw Boundary", shortcut: "B" },
];

const TABLE_SHAPES: Array<{
  id: TableShape;
  icon: typeof Square;
  label: string;
}> = [
  { id: "square", icon: Square, label: "Square" },
  { id: "round", icon: Circle, label: "Round" },
  { id: "rectangular", icon: Square, label: "Rectangular" },
  { id: "oval", icon: Circle, label: "Oval" },
];

export function ToolPanel() {
  const {
    currentTool,
    setCurrentTool,
    tableShape,
    setTableShape,
    snapToGrid,
    setSnapToGrid,
    borders,
    currentFloorId,
  } = useCanvasStore();

  const hasBorder = borders.some((b: { floorId: string }) => b.floorId === currentFloorId);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Tools */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tools</h3>
        
        <div className="flex flex-col gap-1">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            return (
              <Button
                key={tool.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentTool(tool.id)}
                className={`justify-between ${
                  isActive ? "bg-green-500 text-white hover:bg-green-600" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {tool.label}
                </span>
                <kbd className="text-xs opacity-60">{tool.shortcut}</kbd>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-gray-200" />

      {/* Table Shapes */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Add Table</h3>
          <kbd className="text-xs text-gray-400">T</kbd>
        </div>
        
        {!hasBorder ? (
          <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Draw a boundary first
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
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
                  className={`flex-col h-auto py-3 ${
                    isActive ? "bg-green-500 text-white hover:bg-green-600" : ""
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${shape.id === "round" || shape.id === "oval" ? "" : ""}`} />
                  <span className="text-xs">{shape.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-px bg-gray-200" />

      {/* Grid Settings */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Settings</h3>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-500 focus:ring-green-500"
          />
          Snap to Grid
        </label>
      </div>
    </div>
  );
}
