"use client";

import { useRef } from "react";
import { Rect, Circle, Ellipse, Text, Group } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { updateTablePosition, updateTable as updateTableAction } from "@/modules/dashboard/actions";
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
  readOnly?: boolean;
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
    pushHistory,
  } = useCanvasStore();

  const fillColor = TABLE_STATUS_COLORS[status];
  const strokeColor = isSelected ? "#84cc16" : "#6b7280";
  const strokeWidth = isSelected ? 2 : 1;

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return; // Disable selection in read-only mode
    if (currentTool === "select") {
      e.cancelBubble = true; // Prevent stage click
      selectTable(id);
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

    const border = borders.find((b) => b.floorId === currentFloorId);
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

    const border = borders.find((b) => b.floorId === currentFloorId);

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

    // Only save if position actually changed
    if (newX === x && newY === y) return;

    // Push to history
    pushHistory({
      type: 'table_move',
      elementId: id,
      before: { position_x: x, position_y: y },
      after: { position_x: newX, position_y: newY },
    });

    updateTableInStore(id, { position_x: newX, position_y: newY });

    try {
      await updateTablePosition(id, newX, newY);
    } catch (error) {
      console.error("Failed to save table position:", error);
      node.position({ x, y });
      updateTableInStore(id, { position_x: x, position_y: y });
    }
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
      if (child.className === 'Rect') {
        child.width(newWidth);
        child.height(newHeight);
      } else if (child.className === 'Circle') {
        const radius = Math.min(newWidth, newHeight) / 2;
        (child as Konva.Circle).radius(radius);
        child.x(newWidth / 2);
        child.y(newHeight / 2);
      } else if (child.className === 'Ellipse') {
        (child as Konva.Ellipse).radiusX(newWidth / 2);
        (child as Konva.Ellipse).radiusY(newHeight / 2);
        child.x(newWidth / 2);
        child.y(newHeight / 2);
      } else if (child.className === 'Text') {
        child.width(newWidth);
        // Update y position for capacity text (second text element)
        if ((child as Konva.Text).text() !== tableIdentifier) {
          child.y(newHeight - 18);
        } else {
          child.height(newHeight);
        }
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

    updateTableInStore(id, { width: newWidth, height: newHeight });

    try {
      await updateTableAction(id, { width: newWidth, height: newHeight });
    } catch (error) {
      console.error("Failed to save table size:", error);
    }
  };

  // Only allow dragging in select mode and not in read-only mode
  const draggable = !readOnly && currentTool === "select";

  // Render shape
  const renderShape = () => {
    const commonProps = {
      fill: fillColor,
      stroke: strokeColor,
      strokeWidth,
    };

    if (shape === "square" || shape === "rectangular") {
      return <Rect width={width} height={height} {...commonProps} cornerRadius={6} />;
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
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    >
      {renderShape()}
      <Text
        text={tableIdentifier}
        fontSize={12}
        fontFamily="Inter, sans-serif"
        fontStyle="bold"
        fill="#374151"
        width={width}
        height={height}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
      <Text
        text={`${capacity}`}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fill="#6b7280"
        y={height - 18}
        width={width}
        align="center"
        listening={false}
      />
    </Group>
  );
}
