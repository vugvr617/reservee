"use client";

import { useRef, useEffect, useState } from "react";
import { Stage, Layer, Transformer, Line, Rect } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { GridLayer } from "./GridLayer";
import { TableShape } from "./TableShape";
import { WallShape } from "./WallShape";
import { BorderShape } from "./BorderShape";
import { ZoomControls } from "./ZoomControls";
import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from "@/modules/dashboard/constants";
import type { Wall, Border, CanvasTable } from "@/modules/dashboard/types";
import { deleteTable as deleteTableAction } from "@/modules/dashboard/actions";

interface FloorPlanCanvasProps {
  readOnly?: boolean;
}

export function FloorPlanCanvas({ readOnly = false }: FloorPlanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const hasAutoFittedRef = useRef<Set<string>>(new Set());

  const [stageSize, setStageSize] = useState({ width: 1200, height: 800 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const {
    tables,
    selectedTableId,
    selectTable,
    deleteTable: deleteTableFromStore,
    walls,
    selectedWallId,
    selectWall,
    deleteWall,
    currentWallType,
    isDrawingWall,
    setIsDrawingWall,
    tempWallStart,
    setTempWallStart,
    addWall,
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
    undo,
    redo,
    historyIndex,
    history,
    pushHistory,
  } = useCanvasStore();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Space for pan mode
      if (e.code === 'Space' && !e.repeat) {
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

      // ESC to cancel or close help
      if (e.code === 'Escape') {
        e.preventDefault();
        
        if (showShortcutsHelp) {
          setShowShortcutsHelp(false);
          return;
        }
        
        // Cancel wall drawing if in progress
        if (isDrawingWall) {
          setIsDrawingWall(false);
          setTempWallStart(null);
          setMousePos(null);
          return;
        }
        
        // Cancel border drawing if in progress
        if (isDrawingBorder) {
          setIsDrawingBorder(false);
          setTempBorderStart(null);
          setMousePos(null);
          return;
        }
        
        // Clear any selections
        if (selectedTableId) selectTable(null);
        if (selectedWallId) selectWall(null);
        if (selectedBorderId) selectBorder(null);
        return;
      }

      // Only process edit shortcuts if not in read-only mode
      if (!readOnly) {
        // Delete/Backspace to delete selected element
        if (e.code === 'Delete' || e.code === 'Backspace') {
          e.preventDefault();
          
          if (selectedTableId) {
            const table = tables.find(t => t.id === selectedTableId);
            if (table) {
              // Push to history before deleting
              pushHistory({
                type: 'table_delete',
                elementId: selectedTableId,
                before: table,
                after: null,
              });
              
              // Delete from store
              deleteTableFromStore(selectedTableId);
              selectTable(null);
              
              // Delete from database
              try {
                await deleteTableAction(selectedTableId);
              } catch (error) {
                console.error('Failed to delete table:', error);
              }
            }
          }
          
          if (selectedWallId) {
            deleteWall(selectedWallId);
            selectWall(null);
          }
          return;
        }

        // Tool shortcuts (only when not drawing)
        if (!isDrawingWall && !isDrawingBorder) {
          if (e.code === 'KeyV') {
            e.preventDefault();
            setCurrentTool('select');
            return;
          }
          if (e.code === 'KeyH') {
            e.preventDefault();
            setCurrentTool('pan');
            return;
          }
          if (e.code === 'KeyB') {
            e.preventDefault();
            setCurrentTool('border');
            return;
          }
          if (e.code === 'KeyW') {
            e.preventDefault();
            setCurrentTool('wall');
            return;
          }
          if (e.code === 'KeyT') {
            e.preventDefault();
            setCurrentTool('table');
            return;
          }
        }

        // Undo: Cmd/Ctrl + Z
        if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ' && !e.shiftKey) {
          e.preventDefault();
          if (historyIndex >= 0) {
            undo();
          }
          return;
        }

        // Redo: Cmd/Ctrl + Shift + Z
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyZ') {
          e.preventDefault();
          if (historyIndex < history.length - 1) {
            redo();
          }
          return;
        }
      }

      // Zoom shortcuts (work in both modes)
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        const newScale = Math.min(stageScale + ZOOM_STEP, MAX_ZOOM);
        setStageScale(newScale);
        return;
      }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        const newScale = Math.max(stageScale - ZOOM_STEP, MIN_ZOOM);
        setStageScale(newScale);
        return;
      }
      if (e.code === 'Digit0') {
        e.preventDefault();
        setStageScale(1);
        setStagePosition({ x: 0, y: 0 });
        return;
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
    readOnly,
    isDrawingWall,
    isDrawingBorder,
    selectedTableId,
    selectedWallId,
    selectedBorderId,
    showShortcutsHelp,
    tables,
    historyIndex,
    history,
    stageScale,
    setIsDrawingWall,
    setTempWallStart,
    setIsDrawingBorder,
    setTempBorderStart,
    selectTable,
    selectWall,
    selectBorder,
    setCurrentTool,
    deleteTableFromStore,
    deleteWall,
    pushHistory,
    undo,
    redo,
    setStageScale,
    setStagePosition,
  ]);

  // Calculate canvas size dynamically based on table positions
  const getCanvasBounds = () => {
    if (tables.length === 0) {
      return { width: 2000, height: 1500 }; // Default size when no tables
    }

    // Filter tables for current floor
    const currentFloorTables = tables.filter(t => t.floor_id === currentFloorId);

    if (currentFloorTables.length === 0) {
      return { width: 2000, height: 1500 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    currentFloorTables.forEach(table => {
      const right = table.position_x + table.width;
      const bottom = table.position_y + table.height;

      minX = Math.min(minX, table.position_x);
      minY = Math.min(minY, table.position_y);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // Add padding around tables
    const padding = 300;
    return {
      width: Math.max(2000, maxX + padding),
      height: Math.max(1500, maxY + padding)
    };
  };

  const canvasBounds = getCanvasBounds();

  // Handle responsive canvas sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setStageSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Auto-fit border when it first loads or when switching floors
  useEffect(() => {
    if (!currentFloorId) return;

    const border = borders.find((b) => b.floorId === currentFloorId);

    // Only auto-fit if we haven't done so for this floor yet
    if (border && stageSize.width > 0 && stageSize.height > 0 && !hasAutoFittedRef.current.has(currentFloorId)) {
      // Calculate scale to fit border in viewport with padding
      const padding = 100;
      const scaleX = (stageSize.width - padding * 2) / border.width;
      const scaleY = (stageSize.height - padding * 2) / border.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1x

      // Calculate position to center the border
      const x = (stageSize.width - border.width * scale) / 2 - border.x * scale;
      const y = (stageSize.height - border.height * scale) / 2 - border.y * scale;

      setStageScale(scale);
      setStagePosition({ x, y });

      // Mark this floor as auto-fitted
      hasAutoFittedRef.current.add(currentFloorId);
    }
  }, [borders, currentFloorId, stageSize.width, stageSize.height, setStageScale, setStagePosition]);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const transformer = transformerRef.current;
      const stage = stageRef.current;

      let selectedNode = null;

      if (selectedTableId) {
        selectedNode = stage.findOne(`#${selectedTableId}`);
      } else if (selectedBorderId) {
        selectedNode = stage.findOne(`#${selectedBorderId}`);
      }

      if (selectedNode) {
        transformer.nodes([selectedNode]);

        // Enable all anchors for border resize, limited for tables
        if (selectedBorderId && currentTool === "select") {
          transformer.enabledAnchors([
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "top-center",
            "middle-right",
            "bottom-center",
            "middle-left",
          ]);
        } else if (selectedTableId && currentTool === "select") {
          transformer.enabledAnchors([
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]);
        } else {
          transformer.enabledAnchors([]);
        }

        transformer.getLayer()?.batchDraw();
      } else {
        transformer.nodes([]);
        transformer.getLayer()?.batchDraw();
      }
    }
  }, [selectedTableId, selectedBorderId, currentTool]);

  // Handle zoom with mouse wheel
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stagePosition.x) / oldScale,
      y: (pointer.y - stagePosition.y) / oldScale,
    };

    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = Math.min(
      Math.max(oldScale + direction * ZOOM_STEP, MIN_ZOOM),
      MAX_ZOOM
    );

    setStageScale(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStagePosition(newPos);
  };

  // Handle click on empty canvas to deselect, add table, or start/finish wall
  const handleStageClick = async (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    // Only handle if clicking on stage background and not in read-only mode
    if (e.target === e.target.getStage() && !readOnly) {
      if (currentTool === "border") {
        // Border drawing is handled by mouseDown/mouseUp
        return;
      } else if (currentTool === "wall") {
        await handleWallClick(e);
      } else if (currentTool === "table") {
        // Prevent adding tables if no walls exist
        if (walls.length === 0) {
          return;
        }
        // Add new table at click position
        await handleAddTable(e);
      } else {
        // Deselect in select mode
        selectTable(null);
        selectWall(null);
        selectBorder(null);
      }
    }
  };

  const handleWallClick = async (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage || !currentFloorId) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert screen coordinates to canvas coordinates
    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    // Snap to grid if enabled
    const { snapToGrid, gridSize } = useCanvasStore.getState();
    const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    if (!isDrawingWall) {
      // Start drawing wall
      setTempWallStart({ x: finalX, y: finalY });
      setIsDrawingWall(true);
    } else {
      // Finish drawing wall
      if (tempWallStart) {
        const WALL_THICKNESS_MAP = {
          external: 8,
          internal: 4,
          fence: 2,
        };

        const newWall: Wall = {
          id: `wall-${Date.now()}`,
          floorId: currentFloorId,
          type: currentWallType,
          startX: tempWallStart.x,
          startY: tempWallStart.y,
          endX: finalX,
          endY: finalY,
          thickness: WALL_THICKNESS_MAP[currentWallType],
        };

        addWall(newWall);
        setTempWallStart(null);
        setIsDrawingWall(false);
      }
    }
  };

  const handleAddTable = async (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage || !currentFloorId) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    // Convert screen coordinates to canvas coordinates
    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    // Get default size based on table shape
    const { DEFAULT_TABLE_SIZES } = await import("@/modules/dashboard/constants");
    const size = DEFAULT_TABLE_SIZES[useCanvasStore.getState().tableShape];

    // Snap to grid if enabled
    const { snapToGrid, gridSize } = useCanvasStore.getState();
    const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    // Create table via server action
    const { createTable } = await import("@/modules/dashboard/actions");
    const { addTable } = useCanvasStore.getState();

    // Get venue ID from first floor
    const floors = useCanvasStore.getState().floors;
    const currentFloor = floors.find(f => f.id === currentFloorId);
    if (!currentFloor) return;

    const tableCount = tables.filter(t => t.floor_id === currentFloorId).length;
    const tableIdentifier = `T-${tableCount + 1}`;

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
        rotation: 0,
        minCapacity: 2,
        maxCapacity: 4,
      });

      if (result.success && result.data) {
        addTable(result.data);
      }
    } catch (error) {
      console.error("Failed to create table:", error);
    }
  };

  // Handle stage drag (pan mode)
  const handleStageDragEnd = (e: KonvaEventObject<DragEvent>) => {
    const stage = e.target as Konva.Stage;
    setStagePosition({
      x: stage.x(),
      y: stage.y(),
    });
  };

  // Handle mouse move for wall preview and border preview
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    const { snapToGrid, gridSize } = useCanvasStore.getState();
    const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    // Update mouse position for wall or border preview
    if (isDrawingWall && tempWallStart) {
      setMousePos({ x: finalX, y: finalY });
    } else if (isDrawingBorder && tempBorderStart) {
      setMousePos({ x: finalX, y: finalY });
    }
  };

  // Handle border drawing with mouse down/up
  const handleBorderMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (currentTool !== "border" || readOnly || isDrawingBorder) return;

    const stage = stageRef.current;
    if (!stage || !currentFloorId) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    const { snapToGrid, gridSize } = useCanvasStore.getState();
    const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    setTempBorderStart({ x: finalX, y: finalY });
    setIsDrawingBorder(true);
  };

  const handleBorderMouseUp = async (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawingBorder || !tempBorderStart || !currentFloorId) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const x = (pointer.x - stagePosition.x) / stageScale;
    const y = (pointer.y - stagePosition.y) / stageScale;

    const { snapToGrid, gridSize, setCurrentTool } = useCanvasStore.getState();
    const finalX = snapToGrid ? Math.round(x / gridSize) * gridSize : x;
    const finalY = snapToGrid ? Math.round(y / gridSize) * gridSize : y;

    // Calculate rectangle bounds
    const rectX = Math.min(tempBorderStart.x, finalX);
    const rectY = Math.min(tempBorderStart.y, finalY);
    const rectWidth = Math.abs(finalX - tempBorderStart.x);
    const rectHeight = Math.abs(finalY - tempBorderStart.y);

    // Minimum size validation
    if (rectWidth < 100 || rectHeight < 100) {
      alert("Border must be at least 100x100 pixels");
      setIsDrawingBorder(false);
      setTempBorderStart(null);
      setMousePos(null);
      return;
    }

    // Create or update border (only one per floor)
    const newBorder: Border = {
      id: `border-${currentFloorId}`,
      floorId: currentFloorId,
      x: rectX,
      y: rectY,
      width: rectWidth,
      height: rectHeight,
      strokeColor: "#374151",
      strokeWidth: 4,
    };

    addBorder(newBorder);
    setIsDrawingBorder(false);
    setTempBorderStart(null);
    setMousePos(null);

    // Save to database
    const { updateFloorBorder } = await import("@/modules/dashboard/actions");
    try {
      await updateFloorBorder(currentFloorId, {
        x: rectX,
        y: rectY,
        width: rectWidth,
        height: rectHeight,
      });
    } catch (error) {
      console.error("Failed to save border:", error);
    }

    // Auto-switch to select tool after drawing border
    setCurrentTool("select");
  };

  const hasBorder = borders.some((b) => b.floorId === currentFloorId);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-white overflow-hidden"
    >
      {/* Border Drawing Instructions */}
      {!readOnly && currentTool === "border" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-lime-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {!isDrawingBorder
            ? "Click and drag to draw the floor border"
            : "Release to finish drawing the border"}
        </div>
      )}

      {/* Wall Drawing Instructions */}
      {!readOnly && currentTool === "wall" && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-lime-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {!isDrawingWall
            ? "Click to start drawing a wall"
            : "Click again to finish the wall"}
        </div>
      )}

      {/* No Border Warning for Tables */}
      {!readOnly && currentTool === "table" && !hasBorder && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Please draw a floor border first before adding tables
        </div>
      )}

      {/* No Walls Warning */}
      {!readOnly && currentTool === "table" && hasBorder && walls.length === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Please draw walls first before adding tables
        </div>
      )}

      {/* ESC Cancel Tip - shows when something is selected or drawing is in progress */}
      {!readOnly && (selectedTableId || selectedWallId || selectedBorderId || isDrawingWall || isDrawingBorder) && (
        <div className="absolute bottom-4 left-4 z-10 bg-gray-800/90 text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 backdrop-blur-sm">
          <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300 font-mono text-xs">ESC</kbd>
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
        draggable={isSpacePressed || (!readOnly && currentTool === "pan")}
        onDragEnd={handleStageDragEnd}
        style={{
          cursor: isSpacePressed 
            ? 'grab' 
            : currentTool === 'pan' 
              ? 'grab'
              : currentTool === 'wall' || currentTool === 'border'
                ? 'crosshair'
                : currentTool === 'table'
                  ? 'copy'
                  : 'default'
        }}
      >
        {/* Grid Layer */}
        <Layer>
          <GridLayer width={canvasBounds.width} height={canvasBounds.height} />
        </Layer>

        {/* Border Layer */}
        <Layer>
          {borders
            .filter((border) => border.floorId === currentFloorId)
            .map((border) => (
              <BorderShape
                key={border.id}
                {...border}
                isSelected={border.id === selectedBorderId}
              />
            ))}

          {/* Preview rectangle while drawing border */}
          {isDrawingBorder && tempBorderStart && mousePos && (
            <Rect
              x={Math.min(tempBorderStart.x, mousePos.x)}
              y={Math.min(tempBorderStart.y, mousePos.y)}
              width={Math.abs(mousePos.x - tempBorderStart.x)}
              height={Math.abs(mousePos.y - tempBorderStart.y)}
              stroke="#84cc16"
              strokeWidth={4}
              dash={[10, 5]}
              fill="rgba(132, 204, 22, 0.1)"
              listening={false}
            />
          )}
        </Layer>

        {/* Walls Layer */}
        <Layer>
          {walls
            .filter((wall) => wall.floorId === currentFloorId)
            .map((wall) => (
              <WallShape
                key={wall.id}
                {...wall}
                isSelected={wall.id === selectedWallId}
              />
            ))}

          {/* Preview line while drawing wall */}
          {isDrawingWall && tempWallStart && mousePos && (
            <Line
              points={[tempWallStart.x, tempWallStart.y, mousePos.x, mousePos.y]}
              stroke="#84cc16"
              strokeWidth={4}
              dash={[10, 5]}
              lineCap="round"
              listening={false}
            />
          )}
        </Layer>

        {/* Tables Layer */}
        <Layer>
          {tables
            .filter((table) => table.floor_id === currentFloorId)
            .map((table) => (
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
              />
            ))}
        </Layer>

        {/* Transformer Layer (for selection) - only in edit mode */}
        {!readOnly && (
          <Layer>
            <Transformer
              ref={transformerRef}
              borderStroke="#84cc16"
              borderStrokeWidth={2}
              anchorStroke="#84cc16"
              anchorFill="#ffffff"
              anchorSize={8}
            />
          </Layer>
        )}
      </Stage>

      {/* Zoom Controls (floating) */}
      <ZoomControls />

      {/* Keyboard Shortcuts Help Button */}
      <button
        onClick={() => setShowShortcutsHelp(true)}
        className="absolute bottom-4 right-[76px] z-10 bg-white hover:bg-gray-50 text-gray-600 w-9 h-9 rounded-xl shadow-sm flex items-center justify-center text-sm font-medium transition-colors"
        title="Keyboard shortcuts (?)"
      >
        ?
      </button>

      {/* Keyboard Shortcuts Help Panel */}
      <KeyboardShortcutsHelp 
        isOpen={showShortcutsHelp} 
        onClose={() => setShowShortcutsHelp(false)} 
      />
    </div>
  );
}
