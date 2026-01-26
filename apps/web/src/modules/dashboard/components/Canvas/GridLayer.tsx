"use client";

import { Line, Rect } from "react-konva";
import { useCanvasStore } from "@/stores/canvas-store";

interface GridLayerProps {
  width: number;
  height: number;
}

export function GridLayer({ width, height }: GridLayerProps) {
  const { gridSize, borders, currentFloorId } = useCanvasStore();

  // Get border for current floor
  const border = borders.find((b) => b.floorId === currentFloorId);

  // If no border, don't show grid
  if (!border) return null;

  const lines: React.ReactNode[] = [];

  // Calculate grid bounds based on border
  const startX = border.x;
  const endX = border.x + border.width;
  const startY = border.y;
  const endY = border.y + border.height;

  // Vertical lines within border
  for (let x = startX; x <= endX; x += gridSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke="#e5e5e5"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  // Horizontal lines within border
  for (let y = startY; y <= endY; y += gridSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke="#e5e5e5"
        strokeWidth={1}
        listening={false}
      />
    );
  }

  return <>{lines}</>;
}
