"use client";

import { Line } from "react-konva";
import type { Wall, WallType } from "@/modules/dashboard/types";
import { useCanvasStore } from "@/stores/canvas-store";

interface WallShapeProps extends Wall {
  isSelected: boolean;
}

const WALL_COLORS: Record<WallType, string> = {
  external: "#374151", // Gray-700
  internal: "#9ca3af", // Gray-400
  fence: "#d1d5db",    // Gray-300
};

const WALL_THICKNESS: Record<WallType, number> = {
  external: 8,
  internal: 4,
  fence: 2,
};

export function WallShape({
  id,
  type,
  startX,
  startY,
  endX,
  endY,
  thickness,
  isSelected,
}: WallShapeProps) {
  const { selectWall } = useCanvasStore();

  const handleClick = () => {
    selectWall(id);
  };

  return (
    <Line
      id={id}
      points={[startX, startY, endX, endY]}
      stroke={isSelected ? "#84cc16" : WALL_COLORS[type]}
      strokeWidth={isSelected ? thickness + 2 : thickness}
      lineCap="round"
      lineJoin="round"
      onClick={handleClick}
      onTap={handleClick}
      listening={true}
      hitStrokeWidth={20} // Make it easier to select
    />
  );
}
