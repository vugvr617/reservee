"use client";

import { Rect } from "react-konva";
import type { Border } from "@/modules/dashboard/types";
import { useCanvasStore } from "@/stores/canvas-store";
import type { KonvaEventObject } from "konva/lib/Node";

interface BorderShapeProps extends Border {
  isSelected: boolean;
}

export function BorderShape({
  id,
  x,
  y,
  width,
  height,
  strokeColor,
  strokeWidth,
  isSelected,
}: BorderShapeProps) {
  const { selectBorder, updateBorder, borders } = useCanvasStore();

  const handleClick = () => {
    selectBorder(id);
  };

  const handleTransformEnd = async (e: KonvaEventObject<Event>) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and apply to dimensions
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

    // Save to database
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
    <Rect
      id={id}
      x={x}
      y={y}
      width={width}
      height={height}
      stroke={isSelected ? "#84cc16" : strokeColor}
      strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
      fill="transparent"
      dash={[10, 5]} // Dashed line to distinguish from solid walls
      onClick={handleClick}
      onTap={handleClick}
      onTransformEnd={handleTransformEnd}
      listening={true}
      draggable={false}
    />
  );
}
