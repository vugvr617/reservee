"use client";

import { Rect, Group, Text } from "react-konva";
import type { Border } from "@/modules/dashboard/types";
import { useCanvasStore } from "@/stores/canvas-store";
import type { KonvaEventObject } from "konva/lib/Node";

interface BorderShapeProps extends Border {
  isSelected: boolean;
  readOnly?: boolean;
}

export function BorderShape({
  id,
  x,
  y,
  width,
  height,
  isSelected,
  readOnly = false,
  zones,
}: BorderShapeProps) {
  const { selectBorder, updateBorder, borders, currentTool } = useCanvasStore();

  // Disable listening when in table mode or read-only mode
  const shouldListen = !readOnly && (currentTool === "select" || currentTool === "border");

  const handleClick = () => {
    if (shouldListen) {
      selectBorder(id);
    }
  };

  const handleTransformEnd = async (e: KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.max(100, node.width() * scaleX);
    const newHeight = Math.max(100, node.height() * scaleY);
    const newX = node.x();
    const newY = node.y();

    updateBorder(id, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    });

    const border = borders.find((b) => b.id === id);
    if (border) {
      const { updateFloorBorder } = await import("@/modules/dashboard/actions");
      try {
        await updateFloorBorder(border.floorId, {
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      } catch (error) {
        console.error("Failed to save border resize:", error);
      }
    }
  };

  // Modern styling based on mode
  const cornerRadius = 22;

  return (
    <Group>
      {/* White background with shadow - slightly transparent to show grid */}
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(255, 255, 255, 0.85)"
        cornerRadius={cornerRadius}
        shadowColor="rgba(15, 23, 42, 0.06)"
        shadowBlur={24}
        shadowOffsetX={0}
        shadowOffsetY={8}
        listening={false}
      />

      {/* Main border outline - subtle and modern */}
      <Rect
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={
          isSelected
            ? "#22c55e"
            : readOnly
              ? "#d1d5db" // Subtle in view mode
              : "#9ca3af" // More visible in edit mode
        }
        strokeWidth={isSelected ? 2 : 1}
        dash={!readOnly && !isSelected ? [8, 4] : undefined} // Dashed in edit mode
        fill="transparent"
        cornerRadius={cornerRadius}
        onClick={handleClick}
        onTap={handleClick}
        onTransformEnd={handleTransformEnd}
        listening={shouldListen}
        draggable={false}
      />
    </Group>
  );
}
