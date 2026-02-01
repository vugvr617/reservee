"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Transformer, Rect } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { GridLayer } from "./GridLayer";
import { TableShape } from "./TableShape";
import { BorderShape } from "./BorderShape";
import { ZoomControls } from "./ZoomControls";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from "@/modules/dashboard/constants";
import { deleteTable as deleteTableAction } from "@/modules/dashboard/actions";

interface FloorPlanCanvasProps {
  readOnly?: boolean;
}

export function FloorPlanCanvas({ readOnly = false }: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const hasAutoFittedRef = useRef<Map<string, { width: number; height: number; readOnly: boolean }>>(new Map());

  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const {
    tables,
    selectedTableId,
    selectTable,
    deleteTable: deleteTableFromStore,
    borders,
    selectedBorderId,
    selectBorder,
    isDrawingBorder,
    setIsDrawingBorder,
    tempBorderStart,
    setTempBorderStart,
    addBorder,
    stageScale,
    stagePosition,
    setStageScale,
    setStagePosition,
    currentTool,
    setCurrentTool,
    currentFloorId,
    floors,
    undo,
    redo,
    historyIndex,
    history,
    pushHistory,
  } = useCanvasStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space for pan mode (only in edit mode)
      if (e.code === 'Space' && !e.repeat && !readOnly) {
        e.preventDefault();
        setIsSpacePressed(true);
        return;
      }

      // ? to toggle shortcuts help
      if (e.key === '?' || (e.shiftKey && e.code === 'Slash')) {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
        return;
      }

      // ESC to cancel
      if (e.code === 'Escape') {
        e.preventDefault();
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
          return;
        }
        if (isDrawingBorder) {
          setIsDrawingBorder(false);
          setTempBorderStart(null);
          setMousePos(null);
          return;
        }
        if (selectedTableId) selectTable(null);
        if (selectedBorderId) selectBorder(null);
        return;
      }

      // Edit shortcuts
      if (!readOnly) {
        // Delete selected element
        if (e.code === 'Delete' || e.code === 'Backspace') {
          e.preventDefault();
          if (selectedTableId) {
            const table = tables.find(t => t.id === selectedTableId);
            if (table) {
              pushHistory({
                type: 'table_delete',
                elementId: selectedTableId,
                before: table,
                after: null,
              });
              deleteTableFromStore(selectedTableId);
              selectTable(null);
              try {
                await deleteTableAction(selectedTableId);
              } catch (error) {
                console.error('Failed to delete table:', error);
              }
            }
          }
          return;
        }

        // Tool shortcuts
        if (e.code === 'KeyV') { setCurrentTool('select'); return; }
        if (e.code === 'KeyH') { setCurrentTool('pan'); return; }
        if (e.code === 'KeyB') { setCurrentTool('border'); return; }
        if (e.code === 'KeyT') { setCurrentTool('table'); return; }

        // Undo/Redo
        if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey) {
          e.preventDefault();
          if (historyIndex >= 0) undo();
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyZ') {
          e.preventDefault();
          if (historyIndex < history.length - 1) redo();
          return;
        }
      }

      // Zoom (only in edit mode)
      if (!readOnly) {
        if (e.code === 'Equal' || e.code === 'NumpadAdd') {
          e.preventDefault();
          setStageScale(Math.min(stageScale + ZOOM_STEP, MAX_ZOOM));
          return;
        }
        if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
          e.preventDefault();
          setStageScale(Math.max(stageScale - ZOOM_STEP, MIN_ZOOM));
          return;
        }
        if (e.code === 'Digit0') {
          e.preventDefault();
          setStageScale(1);
          setStagePosition({ x: 0, y: 0 });
          return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    readOnly, isDrawingBorder, selectedTableId, selectedBorderId,
    showShortcutsHelp, tables, historyIndex, history, stageScale,
    setIsDrawingBorder, setTempBorderStart, selectTable, selectBorder,
    setCurrentTool, deleteTableFromStore, pushHistory, undo, redo,
    setStageScale, setStagePosition,
  ]);

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Auto-fit to content on floor change or when container/mode changes significantly
  useEffect(() => {
    if (!currentFloorId) return;

    // Check if we should re-fit (new floor, different container size, or different mode)
    const prevFit = hasAutoFittedRef.current.get(currentFloorId);
    const sizeChanged = prevFit && (
      Math.abs(prevFit.width - stageSize.width) > 100 ||
      Math.abs(prevFit.height - stageSize.height) > 100
    );
    const modeChanged = prevFit && prevFit.readOnly !== readOnly;

    if (prevFit && !sizeChanged && !modeChanged) return;

    const border = borders.find(b => b.floorId === currentFloorId);
    if (border && stageRef.current) {
      hasAutoFittedRef.current.set(currentFloorId, {
        width: stageSize.width,
        height: stageSize.height,
        readOnly,
      });
      const padding = 50;
      const scaleX = (stageSize.width - padding * 2) / border.width;
      const scaleY = (stageSize.height - padding * 2) / border.height;
      const scale = Math.min(scaleX, scaleY, 1);

      setStageScale(scale);
      setStagePosition({
        x: (stageSize.width - border.width * scale) / 2 - border.x * scale,
        y: (stageSize.height - border.height * scale) / 2 - border.y * scale,
      });
    }
  }, [currentFloorId, borders, stageSize, readOnly, setStageScale, setStagePosition]);

  // Transformer setup
  useEffect(() => {
    const transformer = transformerRef.current;
    const stage = stageRef.current;
    if (!transformer || !stage) return;

    let selectedNode = null;
    if (selectedTableId) {
      selectedNode = stage.findOne(`#${selectedTableId}`);
    } else if (selectedBorderId) {
      selectedNode = stage.findOne(`#${selectedBorderId}`);
    }

    if (selectedNode && currentTool === "select") {
      transformer.nodes([selectedNode]);
      transformer.enabledAnchors(selectedBorderId ? [
        "top-left", "top-right", "bottom-left", "bottom-right",
        "top-center", "middle-right", "bottom-center", "middle-left",
      ] : ["top-left", "top-right", "bottom-left", "bottom-right"]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
    }
  }, [selectedTableId, selectedBorderId, currentTool]);

  // Canvas bounds
  const getCanvasBounds = () => {
    if (tables.length === 0) return { width: 2000, height: 1500 };
    let maxX = 0, maxY = 0;
    tables.forEach(t => {
      maxX = Math.max(maxX, t.position_x + t.width + 200);
      maxY = Math.max(maxY, t.position_y + t.height + 200);
    });
    return { width: Math.max(2000, maxX), height: Math.max(1500, maxY) };
  };
  const canvasBounds = getCanvasBounds();

  // Wheel zoom (only in edit mode)
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    if (readOnly) return; // Disable zoom in read-only mode

    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, stageScale + direction * ZOOM_STEP));
    setStageScale(newScale);
    setStagePosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Stage click
  const handleStageClick = async (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return;
    
    // Only handle clicks on stage background
    if (e.target !== e.target.getStage()) return;

    if (currentTool === "table") {
      await handleAddTable(e);
    } else if (currentTool === "select") {
      selectTable(null);
      selectBorder(null);
    }
  };

  // Add table
  const handleAddTable = async (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage || !currentFloorId) return;

    const hasBorder = borders.some(b => b.floorId === currentFloorId);
    if (!hasBorder) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    const { DEFAULT_TABLE_SIZES } = await import("@/modules/dashboard/constants");
    const size = DEFAULT_TABLE_SIZES[useCanvasStore.getState().tableShape];

    const { snapToGrid, gridSize } = useCanvasStore.getState();
    const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    const { createTable } = await import("@/modules/dashboard/actions");
    const { addTable } = useCanvasStore.getState();

    const currentFloor = floors.find(f => f.id === currentFloorId);
    if (!currentFloor) return;

    // Generate unique table identifier
    const venueFloorIds = floors.filter(f => f.venue_id === currentFloor.venue_id).map(f => f.id);
    const venueTables = tables.filter(t => venueFloorIds.includes(t.floor_id));
    let maxTableNum = 0;
    venueTables.forEach(t => {
      const match = t.table_identifier.match(/^Table (\d+)$/);
      if (match) maxTableNum = Math.max(maxTableNum, parseInt(match[1], 10));
    });
    const tableIdentifier = `Table ${maxTableNum + 1}`;

    try {
      const result = await createTable({
        venueId: currentFloor.venue_id,
        floorId: currentFloorId,
        tableIdentifier,
        positionX: finalX,
        positionY: finalY,
        width: size.width,
        height: size.height,
        shape: useCanvasStore.getState().tableShape,
        minCapacity: size.minCapacity,
        maxCapacity: size.maxCapacity,
      });

      if (result.data) {
        addTable(result.data);
        pushHistory({
          type: 'table_create',
          elementId: result.data.id,
          before: null,
          after: result.data,
        });
        selectTable(result.data.id);
        setCurrentTool("select");
      }
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  // Mouse move for drawing preview
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawingBorder || !tempBorderStart) return;
    
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    setMousePos({
      x: (pointer.x - stagePosition.x) / stageScale,
      y: (pointer.y - stagePosition.y) / stageScale,
    });
  };

  // Border drawing
  const handleBorderMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (readOnly || currentTool !== "border") return;
    if (e.target !== e.target.getStage()) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    setTempBorderStart({ x, y });
    setIsDrawingBorder(true);
  };

  const handleBorderMouseUp = async () => {
    if (!isDrawingBorder || !tempBorderStart || !mousePos || !currentFloorId) return;

    const rectX = Math.min(tempBorderStart.x, mousePos.x);
    const rectY = Math.min(tempBorderStart.y, mousePos.y);
    const rectWidth = Math.abs(mousePos.x - tempBorderStart.x);
    const rectHeight = Math.abs(mousePos.y - tempBorderStart.y);

    if (rectWidth < 50 || rectHeight < 50) {
      setIsDrawingBorder(false);
      setTempBorderStart(null);
      setMousePos(null);
      return;
    }

    const newBorder = {
      id: `border-${currentFloorId}`,
      floorId: currentFloorId,
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight,
      strokeColor: "#6b7280",
      strokeWidth: 3,
    };

    addBorder(newBorder);
    setIsDrawingBorder(false);
    setTempBorderStart(null);
    setMousePos(null);

    const { updateFloorBorder } = await import("@/modules/dashboard/actions");
    try {
      await updateFloorBorder(currentFloorId, {
        x: rectX, y: rectY, width: rectWidth, height: rectHeight,
      });
    } catch (error) {
      console.error("Failed to save border:", error);
    }

    setCurrentTool("select");
  };

  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const stage = e.target;
    if (stage === stageRef.current) {
      setStagePosition({ x: stage.x(), y: stage.y() });
    }
  };

  const hasBorder = borders.some(b => b.floorId === currentFloorId);

  // Cursor style
  const getCursor = () => {
    if (isSpacePressed) return 'grab';
    if (currentTool === 'pan') return 'grab';
    if (currentTool === 'border') return 'crosshair';
    if (currentTool === 'table') return hasBorder ? 'copy' : 'not-allowed';
    return 'default';
  };

  return (
    <div ref={containerRef} className="relative h-full w-full bg-gray-100 overflow-hidden">
      {/* Instructions */}
      {!readOnly && currentTool === "border" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {!isDrawingBorder ? "Click and drag to draw the floor boundary" : "Release to finish"}
        </div>
      )}

      {!readOnly && currentTool === "table" && !hasBorder && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Draw a floor boundary first (press B)
        </div>
      )}

      {!readOnly && currentTool === "table" && hasBorder && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Click inside the floor to add a table
        </div>
      )}

      {/* ESC hint */}
      {!readOnly && (selectedTableId || selectedBorderId || isDrawingBorder) && (
        <div className="absolute bottom-4 left-4 z-10 bg-gray-800/90 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
          <kbd className="bg-gray-700 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
          <span className="text-gray-300">to cancel</span>
        </div>
      )}

      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePosition.x}
        y={stagePosition.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        onMouseDown={currentTool === "border" ? handleBorderMouseDown : undefined}
        onMouseUp={currentTool === "border" ? handleBorderMouseUp : undefined}
        onMouseMove={handleMouseMove}
        draggable={!readOnly && (isSpacePressed || currentTool === "pan")}
        onDragEnd={handleStageDragEnd}
        style={{ cursor: getCursor() }}
      >
        {/* Grid */}
        <Layer>
          <GridLayer width={canvasBounds.width} height={canvasBounds.height} readOnly={readOnly} />
        </Layer>

        {/* Borders */}
        <Layer>
          {borders
            .filter(border => border.floorId === currentFloorId)
            .map(border => (
              <BorderShape
                key={border.id}
                {...border}
                isSelected={border.id === selectedBorderId}
                readOnly={readOnly}
              />
            ))}
        </Layer>

        {/* Drawing preview */}
        {isDrawingBorder && tempBorderStart && mousePos && (
          <Layer>
            <Rect
              x={Math.min(tempBorderStart.x, mousePos.x)}
              y={Math.min(tempBorderStart.y, mousePos.y)}
              width={Math.abs(mousePos.x - tempBorderStart.x)}
              height={Math.abs(mousePos.y - tempBorderStart.y)}
              stroke="#22c55e"
              strokeWidth={3}
              dash={[10, 5]}
              listening={false}
            />
          </Layer>
        )}

        {/* Tables */}
        <Layer>
          {tables
            .filter(table => table.floor_id === currentFloorId)
            .map(table => (
              <TableShape
                key={table.id}
                id={table.id}
                x={table.position_x}
                y={table.position_y}
                width={table.width}
                height={table.height}
                shape={table.shape as "square" | "round" | "rectangular" | "oval"}
                rotation={table.rotation ?? 0}
                status={table.status}
                tableIdentifier={table.table_identifier}
                capacity={table.max_capacity ?? 4}
                isSelected={table.id === selectedTableId}
                readOnly={readOnly}
              />
            ))}
        </Layer>

        {/* Transformer */}
        {!readOnly && (
          <Layer>
            <Transformer
              ref={transformerRef}
              borderStroke="#22c55e"
              borderStrokeWidth={2}
              anchorStroke="#22c55e"
              anchorFill="#ffffff"
              anchorSize={8}
              rotateEnabled={false}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            />
          </Layer>
        )}
      </Stage>

      {!readOnly && <ZoomControls />}

      {!readOnly && (
        <button
          onClick={() => setShowShortcutsHelp(true)}
          className="absolute bottom-4 right-[76px] z-10 bg-white hover:bg-gray-50 text-gray-600 w-9 h-9 rounded-xl shadow-sm flex items-center justify-center text-sm font-medium transition-colors"
          title="Keyboard shortcuts (?)"
        >
          ?
        </button>
      )}

      {!readOnly && (
        <KeyboardShortcutsHelp
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}
    </div>
  );
}
