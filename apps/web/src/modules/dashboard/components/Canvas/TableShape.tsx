"use client";

import { useRef, useState } from "react";
import { Rect, Circle, Ellipse, Text, Group, Path } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { TABLE_STATUS_COLORS } from "@/modules/dashboard/constants";
import { constrainToBorder } from "@/modules/dashboard/utils/collision";
import type { Border } from "@/modules/dashboard/types";

// Checkmark icon SVG path
const CHECKMARK_ICON_PATH = "M20 6L9 17l-5-5";


// Chair dimensions
const CHAIR_THICKNESS = 12; // How thick the chair is (perpendicular to table edge)
const CHAIR_GAP = 8; // Distance from table edge
const CHAIR_SPACING = 6; // Gap between adjacent chairs on the same side

// Calculate chair positions and dimensions based on capacity
function calculateChairPositions(
  capacity: number,
  tableWidth: number,
  tableHeight: number,
  shape: "square" | "round" | "rectangular" | "oval"
): Array<{ x: number; y: number; width: number; height: number; rotation: number }> {
  const positions: Array<{ x: number; y: number; width: number; height: number; rotation: number }> = [];

  if (capacity <= 0) return positions;

  // Simple logic: distribute chairs on 4 sides (top, right, bottom, left)
  // For small capacities (2-4), place 1 per side
  // For larger capacities, distribute evenly on longer sides

  const isHorizontal = tableWidth >= tableHeight;

  // Determine how many chairs per side
  let topCount = 0, rightCount = 0, bottomCount = 0, leftCount = 0;

  if (capacity === 1) {
    topCount = 1;
  } else if (capacity === 2) {
    leftCount = 1;
    rightCount = 1;
  } else if (capacity === 3) {
    topCount = 1;
    leftCount = 1;
    rightCount = 1;
  } else if (capacity === 4) {
    topCount = 1;
    rightCount = 1;
    bottomCount = 1;
    leftCount = 1;
  } else if (capacity === 5) {
    topCount = 2;
    bottomCount = 2;
    leftCount = 1;
  } else if (capacity === 6) {
    if (isHorizontal) {
      topCount = 3;
      bottomCount = 3;
    } else {
      leftCount = 3;
      rightCount = 3;
    }
  } else if (capacity === 8) {
    topCount = 2;
    rightCount = 2;
    bottomCount = 2;
    leftCount = 2;
  } else {
    // For other capacities, distribute evenly
    const perSide = Math.ceil(capacity / 4);
    topCount = bottomCount = leftCount = rightCount = perSide;
  }

  // Top chairs
  if (topCount > 0) {
    const chairWidth = (tableWidth - CHAIR_SPACING * (topCount - 1)) / topCount;
    for (let i = 0; i < topCount; i++) {
      const x = i * (chairWidth + CHAIR_SPACING);
      positions.push({
        x,
        y: -CHAIR_GAP - CHAIR_THICKNESS,
        width: chairWidth,
        height: CHAIR_THICKNESS,
        rotation: 0,
      });
    }
  }

  // Bottom chairs
  if (bottomCount > 0) {
    const chairWidth = (tableWidth - CHAIR_SPACING * (bottomCount - 1)) / bottomCount;
    for (let i = 0; i < bottomCount; i++) {
      const x = i * (chairWidth + CHAIR_SPACING);
      positions.push({
        x,
        y: tableHeight + CHAIR_GAP,
        width: chairWidth,
        height: CHAIR_THICKNESS,
        rotation: 0,
      });
    }
  }

  // Left chairs
  if (leftCount > 0) {
    const chairHeight = (tableHeight - CHAIR_SPACING * (leftCount - 1)) / leftCount;
    for (let i = 0; i < leftCount; i++) {
      const y = i * (chairHeight + CHAIR_SPACING);
      positions.push({
        x: -CHAIR_GAP - CHAIR_THICKNESS,
        y,
        width: CHAIR_THICKNESS,
        height: chairHeight,
        rotation: 0,
      });
    }
  }

  // Right chairs
  if (rightCount > 0) {
    const chairHeight = (tableHeight - CHAIR_SPACING * (rightCount - 1)) / rightCount;
    for (let i = 0; i < rightCount; i++) {
      const y = i * (chairHeight + CHAIR_SPACING);
      positions.push({
        x: tableWidth + CHAIR_GAP,
        y,
        width: CHAIR_THICKNESS,
        height: chairHeight,
        rotation: 0,
      });
    }
  }

  return positions;
}

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

// Get fill/stroke colors based on reservation count (read-only mode only)
function getReservationColors(count: number): { fill: string; stroke: string } {
  if (count >= 5) return { fill: "#fee2e2", stroke: "#fca5a5" }; // Heavy load (red)
  if (count >= 3) return { fill: "#fef9c3", stroke: "#fcd34d" }; // Moderate (amber)
  if (count >= 1) return { fill: "#dcfce7", stroke: "#86efac" }; // Light load (green)
  return { fill: "#e5e7eb", stroke: "#d1d5db" }; // Available (default)
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

  // Colors: in read-only mode, color by reservation count; in edit mode, default gray/selected teal
  const reservationColors = readOnly ? getReservationColors(reservationCount) : null;
  const fillColor = isSelected ? "#7dd3c0" : (reservationColors?.fill ?? "#e5e7eb");
  const strokeColor = isSelected ? "#5eead4" : (reservationColors?.stroke ?? "#d1d5db");
  const strokeWidth = 2;

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) {
      // In read-only mode, fire popup callback with screen position
      if (onReadOnlyClick) {
        e.cancelBubble = true;
        const pos = groupRef.current?.getAbsolutePosition();
        if (pos) {
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

  // Get stage scale for screen position calculation
  const stageScale = groupRef.current?.getStage()?.scaleX() ?? 1;

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

    // Update children dimensions directly so Transformer syncs immediately
    const children = node.getChildren();
    children.forEach((child) => {
      if (child.className === 'Circle') {
        const radius = Math.min(newWidth, newHeight) / 2;
        (child as Konva.Circle).radius(radius);
        child.x(newWidth / 2);
        child.y(newHeight / 2);
      } else if (child.className === 'Ellipse') {
        (child as Konva.Ellipse).radiusX(newWidth / 2);
        (child as Konva.Ellipse).radiusY(newHeight / 2);
        child.x(newWidth / 2);
        child.y(newHeight / 2);
      } else if (child.className === 'Rect') {
        const rect = child as Konva.Rect;
        const cornerRadius = rect.cornerRadius();

        // Badge background (cornerRadius = 9) - keep size fixed, only reposition
        if (cornerRadius === 9) {
          const currentBadgeWidth = Math.max(50, tableIdentifier.length * 7 + 16);
          child.x(newWidth / 2 - currentBadgeWidth / 2);
          child.width(currentBadgeWidth);
          child.height(18);
        }
        // Table shape (cornerRadius = 8) - resize normally
        else if (cornerRadius === 8) {
          child.width(newWidth);
          child.height(newHeight);
        }
      } else if (child.className === 'Text') {
        const textNode = child as Konva.Text;
        // Table ID text (positioned in badge above table)
        if (textNode.text() === tableIdentifier) {
          const currentBadgeWidth = Math.max(50, tableIdentifier.length * 7 + 16);
          child.x(newWidth / 2 - currentBadgeWidth / 2);
          child.width(currentBadgeWidth);
        }
        // Capacity text (positioned in center)
        else {
          child.x(newWidth / 2 + 2);
          child.y(newHeight / 2 - 7);
        }
      } else if (child.className === 'Path') {
        // Users icon - reposition to center-left
        child.x(newWidth / 2 - 18);
        child.y(newHeight / 2 - 8);
      }
    });

    // Force redraw to update Transformer bounds
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

  // Extract just the number from table identifier (e.g., "Table 5" -> "5")
  const tableNumber = tableIdentifier.replace(/[^\d]/g, '') || tableIdentifier;

  // Simplified table rendering
  const renderShape = () => {
    const commonProps = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
    };

    if (shape === "square" || shape === "rectangular") {
      return <Rect width={width} height={height} {...commonProps} cornerRadius={12} />;
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
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={2}
          cornerRadius={6}
          listening={false}
        />
      ))}

      {/* Table shape */}
      {renderShape()}

      {/* Table number - large and centered */}
      <Text
        text={tableNumber}
        fontSize={32}
        fontFamily="Inter, sans-serif"
        fontStyle="600"
        fill="#9ca3af"
        x={0}
        y={height / 2 - 16}
        width={width}
        align="center"
        listening={false}
      />

      {/* Checkmark icon for selected table */}
      {isSelected && (
        <Path
          data={CHECKMARK_ICON_PATH}
          fill="none"
          stroke="#374151"
          strokeWidth={2.5}
          scale={{ x: 0.8, y: 0.8 }}
          x={width - 18}
          y={8}
          listening={false}
          lineCap="round"
          lineJoin="round"
        />
      )}

      {/* Reservation count text below table name (read-only mode only) */}
      {readOnly && reservationCount > 0 && (
        <Text
          text={`${reservationCount} ${reservationCount === 1 ? "reservation" : "reservations"}`}
          fontSize={14}
          fontFamily="Inter, sans-serif"
          fontStyle="500"
          fill={reservationCount >= 5 ? "#ef4444" : reservationCount >= 3 ? "#d97706" : "#22c55e"}
          x={0}
          y={height / 2 + 22}
          width={width}
          align="center"
          listening={false}
        />
      )}
    </Group>
  );
}
