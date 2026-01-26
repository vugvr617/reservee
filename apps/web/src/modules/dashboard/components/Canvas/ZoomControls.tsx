"use client";

import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasStore } from "@/stores/canvas-store";
import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from "@/modules/dashboard/constants";

export function ZoomControls() {
  const { 
    stageScale, 
    setStageScale, 
    setStagePosition,
    undo,
    redo,
    historyIndex,
    history,
  } = useCanvasStore();

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const handleZoomIn = () => {
    const newScale = Math.min(stageScale + ZOOM_STEP, MAX_ZOOM);
    setStageScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(stageScale - ZOOM_STEP, MIN_ZOOM);
    setStageScale(newScale);
  };

  const handleReset = () => {
    setStageScale(1);
    setStagePosition({ x: 0, y: 0 });
  };

  const zoomPercentage = Math.round(stageScale * 100);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm">
      {/* Undo/Redo */}
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        className="h-9 w-9"
        title="Undo (⌘Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        className="h-9 w-9"
        title="Redo (⌘⇧Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
      <div className="h-px bg-gray-200" />
      
      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomIn}
        disabled={stageScale >= MAX_ZOOM}
        className="h-9 w-9"
        title="Zoom in (+)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <div className="flex h-9 w-9 items-center justify-center text-xs font-medium text-gray-600">
        {zoomPercentage}%
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleZoomOut}
        disabled={stageScale <= MIN_ZOOM}
        className="h-9 w-9"
        title="Zoom out (-)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="h-px bg-gray-200" />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleReset}
        className="h-9 w-9"
        title="Reset view (0)"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

