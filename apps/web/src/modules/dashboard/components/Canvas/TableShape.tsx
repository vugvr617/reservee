"use client";

import { useRef, useState } from "react";
import { Rect, Circle, Ellipse, Text, Group, Path } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useCanvasStore } from "@/stores/canvas-store";
import { TABLE_STATUS_COLORS } from "@/modules/dashboard/constants";
import { constrainToBorder } from "@/modules/dashboard/utils/collision";

// Lucide Users icon SVG path
const USERS_ICON_PATH = "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75";

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

  const fillColor = TABLE_STATUS_COLORS[status];

  // Enhanced stroke colors for hover and selected states
  const strokeColor = isSelected
    ? "#84cc16" // Lime green when selected
    : isHovered
    ? "#3b82f6" // Blue on hover
    : "#6b7280"; // Gray default

  const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 2;

  const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (readOnly) return; // Disable selection in read-only mode
    if (currentTool === "select") {
      e.cancelBubble = true; // Prevent stage click
      selectTable(id);
    }
  };

  const handleMouseEnter = (e: KonvaEventObject<MouseEvent>) => {
    if (readOnly) return;
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

  // Calculate badge width based on text length
  const badgeWidth = Math.max(50, tableIdentifier.length * 7 + 16);
  const badgeX = width / 2 - badgeWidth / 2;

  // Render shape with enhanced hover/selected states
  const renderShape = () => {
    // Enhanced shadow on hover and selected
    const shadowBlur = isSelected ? 12 : isHovered ? 10 : 8;
    const shadowOffsetY = isSelected ? 4 : isHovered ? 3 : 2;
    const shadowOpacity = isSelected ? 0.4 : isHovered ? 0.35 : 0.3;

    // Add faint selection background
    const tableFill = isSelected
      ? `${fillColor}` // Could add opacity here if needed
      : fillColor;

    const commonProps = {
      fill: tableFill,
      stroke: strokeColor,
      strokeWidth: strokeWidth,
      shadowColor: isSelected ? 'rgba(132, 204, 22, 0.3)' : 'rgba(0, 0, 0, 0.15)',
      shadowBlur: shadowBlur,
      shadowOffsetX: 0,
      shadowOffsetY: shadowOffsetY,
      shadowOpacity: shadowOpacity,
    };

    // Inner border for depth effect
    const innerBorderProps = {
      stroke: 'rgba(255, 255, 255, 0.4)',
      strokeWidth: 2,
      fill: 'transparent',
      listening: false,
    };

    const inset = 4; // Distance from outer border

    if (shape === "square" || shape === "rectangular") {
      return (
        <>
          <Rect width={width} height={height} {...commonProps} cornerRadius={8} />
          <Rect
            x={inset}
            y={inset}
            width={width - inset * 2}
            height={height - inset * 2}
            {...innerBorderProps}
            cornerRadius={6}
          />
        </>
      );
    }

    if (shape === "round") {
      const radius = Math.min(width, height) / 2;
      return (
        <>
          <Circle x={width / 2} y={height / 2} radius={radius} {...commonProps} />
          <Circle
            x={width / 2}
            y={height / 2}
            radius={radius - inset}
            {...innerBorderProps}
          />
        </>
      );
    }

    if (shape === "oval") {
      return (
        <>
          <Ellipse x={width / 2} y={height / 2} radiusX={width / 2} radiusY={height / 2} {...commonProps} />
          <Ellipse
            x={width / 2}
            y={height / 2}
            radiusX={width / 2 - inset}
            radiusY={height / 2 - inset}
            {...innerBorderProps}
          />
        </>
      );
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
      {/* Table shape */}
      {renderShape()}

      {/* Badge background for Table ID - positioned above table */}
      <Rect
        x={badgeX}
        y={-24}
        width={badgeWidth}
        height={18}
        fill="#f3f4f6"
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={9}
        listening={false}
      />

      {/* Table ID text inside badge */}
      <Text
        text={tableIdentifier}
        fontSize={10}
        fontFamily="Inter, sans-serif"
        fontStyle="bold"
        fill="#374151"
        x={badgeX}
        y={-21}
        width={badgeWidth}
        align="center"
        listening={false}
      />

      {/* Users icon - positioned in center-left */}
      <Path
        data={USERS_ICON_PATH}
        fill="#374151"
        stroke="#374151"
        strokeWidth={1.5}
        scale={{ x: 0.7, y: 0.7 }}
        x={width / 2 - 18}
        y={height / 2 - 8}
        listening={false}
      />

      {/* Capacity number - positioned in center-right */}
      <Text
        text={`${capacity}`}
        fontSize={14}
        fontFamily="Inter, sans-serif"
        fontStyle="bold"
        fill="#374151"
        x={width / 2 + 2}
        y={height / 2 - 7}
        listening={false}
      />
    </Group>
  );
}
