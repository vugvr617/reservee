"use client";

import { Rect, Group } from "react-konva";
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

  return (
    <Group>
      {/* Main border outline (wall) */}
      <Rect
        id={id}
        x={x}
        y={y}
        width={width}
        height={height}
        stroke={isSelected ? "#22c55e" : "#6b7280"}
        strokeWidth={isSelected ? 4 : 3}
        fill="transparent"
        cornerRadius={8}
        onClick={handleClick}
        onTap={handleClick}
        onTransformEnd={handleTransformEnd}
        listening={shouldListen}
        draggable={false}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={isSelected ? 8 : 0}
        shadowOffsetX={0}
        shadowOffsetY={2}
      />
    </Group>
  );
}
