"use client";

import { useRef, useState } from "react";
import { Rect, Circle, Ellipse, Text, Group } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { constrainToBorder } from "@/modules/dashboard/utils/collision";
import { calculateChairPositions } from "@/modules/dashboard/utils/chairs";
import type { Border } from "@/modules/dashboard/types";

interface TableShapeProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "square" | "round" | "rectangular" | "oval";
  rotation: number;
  status?: "available" | "occupied" | "reserved";
  tableIdentifier: string;
  capacity: number;
  isSelected: boolean;
  readOnly?: boolean;
  reservationCount?: number;
  onReadOnlyClick?: (tableId: string, screenPos: { x: number; y: number }) => void;
}

export function TableShape({
  id,
  x,
  y,
  width,
  height,
  shape,
  rotation,
  status = "available",
  tableIdentifier,
  capacity,
  isSelected,
  readOnly = false,
  reservationCount = 0,
  onReadOnlyClick,
}: TableShapeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    selectTable,
    currentTool,
    snapToGrid,
    gridSize,
    updateTable: updateTableInStore,
    borders,
    currentFloorId,
    pushHistory,
    markTableDirty,
  } = useCanvasStore();

  // Edit-mode appearance: a selected table is a white card with a green border;
  // unselected tables are soft gray cards. Chairs stay a neutral gray either way.
  const fillColor = isSelected ? "#ffffff" : "#eceef1";
  const strokeColor = isSelected ? "#22c55e" : "#e5e7eb";
  const strokeWidth = isSelected ? 2 : 1.5;
  const chairFill = "#e2e5ea";

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) {
      // In read-only mode, fire popup callback with screen position
      if (onReadOnlyClick) {
        e.cancelBubble = true;
        const pos = groupRef.current?.getAbsolutePosition();
        if (pos) {
          // Read scale inside the handler (not during render).
          const stageScale = groupRef.current?.getStage()?.scaleX() ?? 1;
          const screenPos = {
            x: pos.x + (width * stageScale) / 2,
            y: pos.y,
          };
          onReadOnlyClick(id, screenPos);
        }
      }
      return;
    }
    if (currentTool === "select") {
      e.cancelBubble = true; // Prevent stage click
      selectTable(id);
    }
  };

  const handleMouseEnter = (e: KonvaEventObject<MouseEvent>) => {
    if (readOnly) {
      // Show pointer cursor in read-only mode
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = "pointer";
      }
      return;
    }
    if (currentTool === "select") {
      setIsHovered(true);
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = "move";
      }
    }
  };

  const handleMouseLeave = (e: KonvaEventObject<MouseEvent>) => {
    setIsHovered(false);
    const container = e.target.getStage()?.container();
    if (container) {
      container.style.cursor = "default";
    }
  };

  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    if (currentTool === "select") {
      selectTable(id);
    }
  };

  // Constrain position during drag (real-time)
  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node) return;

    const border = borders.find((b: Border) => b.floorId === currentFloorId);
    if (!border) return;

    const nodeX = node.x();
    const nodeY = node.y();
    const constrained = constrainToBorder(nodeX, nodeY, width, height, border);

    // Only update if position changed (to avoid unnecessary updates)
    if (nodeX !== constrained.x || nodeY !== constrained.y) {
      node.position({ x: constrained.x, y: constrained.y });
    }
  };

  const handleDragEnd = async (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    if (!node) return;

    let newX = node.x();
    let newY = node.y();

    const border = borders.find((b: Border) => b.floorId === currentFloorId);

    // Final constraint check
    const constrained = constrainToBorder(newX, newY, width, height, border);
    newX = constrained.x;
    newY = constrained.y;

    // Snap to grid if enabled
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;
      // Re-constrain after snapping
      const reConstrained = constrainToBorder(newX, newY, width, height, border);
      newX = reConstrained.x;
      newY = reConstrained.y;
    }

    node.position({ x: newX, y: newY });

    // Only update if position actually changed
    if (newX === x && newY === y) return;

    // Push to history
    pushHistory({
      type: 'table_move',
      elementId: id,
      before: { position_x: x, position_y: y },
      after: { position_x: newX, position_y: newY },
    });

    // Update store and mark as dirty (don't save to DB yet)
    updateTableInStore(id, { position_x: newX, position_y: newY });
    markTableDirty(id);
  };

  const handleTransformEnd = async (e: KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to 1
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(40, Math.round(width * scaleX));
    const newHeight = Math.max(40, Math.round(height * scaleY));

    // Children (shape, chairs, label) are positioned from the width/height props,
    // so updating the store re-renders them correctly. The rendered size already
    // matches the transformed size, so the Transformer box stays in sync.
    node.getLayer()?.batchDraw();

    pushHistory({
      type: 'table_update',
      elementId: id,
      before: { width, height },
      after: { width: newWidth, height: newHeight },
    });

    // Update store and mark as dirty (don't save to DB yet)
    updateTableInStore(id, { width: newWidth, height: newHeight });
    markTableDirty(id);
  };

  // Only allow dragging in select mode and not in read-only mode
  const draggable = !readOnly && currentTool === "select";

  // Calculate chair positions
  const chairPositions = calculateChairPositions(capacity, width, height, shape);

  // Extract just the number from table identifier (e.g., "Table 5" -> "5").
  // Named tables (no digits, e.g. "My Table") keep their full label.
  const tableNumber = tableIdentifier.replace(/[^\d]/g, '') || tableIdentifier;
  const hasDigits = /\d/.test(tableIdentifier);

  // Scale text sizes to the table so labels stay readable regardless of table dimensions.
  const tableMinDim = Math.min(width, height);
  const numberFontSize = Math.max(20, Math.min(72, tableMinDim * 0.28));
  // Names need a smaller font than big numbers so they fit and wrap nicely.
  const labelFontSize = hasDigits ? numberFontSize : Math.max(12, Math.min(24, tableMinDim * 0.18));
  const countFontSize = Math.max(12, Math.min(28, tableMinDim * 0.09));

  // Simplified table rendering
  const renderShape = () => {
    const commonProps = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      shadowColor: "#0f172a",
      shadowBlur: isSelected ? 12 : 8,
      shadowOpacity: isSelected ? 0.12 : 0.07,
      shadowOffsetY: 2,
    };

    if (shape === "square" || shape === "rectangular") {
      return <Rect width={width} height={height} {...commonProps} cornerRadius={16} />;
    }

    if (shape === "round") {
      const radius = Math.min(width, height) / 2;
      return <Circle x={width / 2} y={height / 2} radius={radius} {...commonProps} />;
    }

    if (shape === "oval") {
      return <Ellipse x={width / 2} y={height / 2} radiusX={width / 2} radiusY={height / 2} {...commonProps} />;
    }

    return null;
  };

  return (
    <Group
      id={id}
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      onClick={handleClick}
      onTap={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {/* Chairs */}
      {chairPositions.map((chair, index) => (
        <Rect
          key={`chair-${index}`}
          x={chair.x}
          y={chair.y}
          width={chair.width}
          height={chair.height}
          fill={chairFill}
          cornerRadius={6}
          listening={false}
        />
      ))}

      {/* Table shape */}
      {renderShape()}

      {/* Table label - centered, wraps for named tables */}
      <Text
        text={tableNumber}
        fontSize={labelFontSize}
        fontFamily="Inter, sans-serif"
        fontStyle="700"
        fill="#4b5563"
        x={0}
        y={0}
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        wrap="word"
        padding={6}
        listening={false}
      />

      {/* Reservation count text below table name (read-only mode only) */}
      {readOnly && reservationCount > 0 && (
        <Text
          text={`${reservationCount} ${reservationCount === 1 ? "reservation" : "reservations"}`}
          fontSize={countFontSize}
          fontFamily="Inter, sans-serif"
          fontStyle="500"
          fill={reservationCount >= 5 ? "#ef4444" : reservationCount >= 3 ? "#d97706" : "#22c55e"}
          x={0}
          y={height / 2 + numberFontSize / 2 + 6}
          width={width}
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
}
