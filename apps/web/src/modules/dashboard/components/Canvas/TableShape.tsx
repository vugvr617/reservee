"use client";

import { useRef, useEffect } from "react";
import { Rect, Circle, Ellipse, Text, Group } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { updateTablePosition } from "@/modules/dashboard/actions";
import { TABLE_STATUS_COLORS } from "@/modules/dashboard/constants";
import { constrainToBorder } from "@/modules/dashboard/utils/collision";

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
}: TableShapeProps) {
  const groupRef = useRef<Konva.Group>(null);
  const {
    selectTable,
    currentTool,
    snapToGrid,
    gridSize,
    updateTable: updateTableInStore,
    borders,
    currentFloorId,
  } = useCanvasStore();

  const fillColor = TABLE_STATUS_COLORS[status];
  const strokeColor = isSelected ? "#84cc16" : "#333333";
  const strokeWidth = isSelected ? 3 : 2;

  const handleClick = () => {
    if (currentTool === "select") {
      selectTable(id);
    }
  };

  const handleDragStart = () => {
    if (currentTool === "select") {
      selectTable(id);
    }
  };

  const handleDragEnd = async (e: KonvaEventObject<DragEvent>) => {
    const node = e.target.getParent();
    if (!node) return;

    let newX = node.x();
    let newY = node.y();

    // Get border for current floor
    const border = borders.find((b) => b.floorId === currentFloorId);

    // Constrain to border first
    const constrained = constrainToBorder(newX, newY, width, height, border);
    newX = constrained.x;
    newY = constrained.y;

    // Snap to grid if enabled
    if (snapToGrid) {
      newX = Math.round(newX / gridSize) * gridSize;
      newY = Math.round(newY / gridSize) * gridSize;

      // Re-constrain after snapping (edge case where snap pushes outside border)
      const reConstrained = constrainToBorder(newX, newY, width, height, border);
      newX = reConstrained.x;
      newY = reConstrained.y;
    }

    // Update node position to constrained value
    node.position({ x: newX, y: newY });

    // Update in store (optimistic)
    updateTableInStore(id, {
      position_x: newX,
      position_y: newY,
    });

    // Save to database
    try {
      await updateTablePosition(id, newX, newY);
    } catch (error) {
      console.error("Failed to save table position:", error);
      // Revert on error
      node.position({ x, y });
      updateTableInStore(id, {
        position_x: x,
        position_y: y,
      });
    }
  };

  const draggable = currentTool === "select";
  const cursorStyle = currentTool === "select" ? "pointer" : "default";

  // Real-time drag constraint function
  const dragBoundFunc = (pos: { x: number; y: number }) => {
    const border = borders.find((b) => b.floorId === currentFloorId);
    return constrainToBorder(pos.x, pos.y, width, height, border);
  };

  // Render different shapes
  const renderShape = () => {
    if (shape === "square" || shape === "rectangular") {
      return (
        <Rect
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          cornerRadius={4}
        />
      );
    }

    if (shape === "round") {
      const radius = Math.min(width, height) / 2;
      return (
        <Circle
          x={width / 2}
          y={height / 2}
          radius={radius}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    }

    if (shape === "oval") {
      return (
        <Ellipse
          x={width / 2}
          y={height / 2}
          radiusX={width / 2}
          radiusY={height / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    }

    return null;
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      rotation={rotation}
      draggable={draggable}
      dragBoundFunc={draggable ? dragBoundFunc : undefined}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {renderShape()}
      <Text
        text={tableIdentifier}
        fontSize={12}
        fontFamily="Geist Sans, sans-serif"
        fill="#333333"
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
      <Text
        text={`${capacity}`}
        fontSize={10}
        fontFamily="Geist Sans, sans-serif"
        fill="#666666"
        y={height - 16}
        width={width}
        align="center"
        listening={false}
      />
    </Group>
  );
}
