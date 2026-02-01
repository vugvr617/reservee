"use client";

import { Circle } from "react-konva";
import { useCanvasStore } from "@/stores/canvas-store";

interface GridLayerProps {
  width: number;
  height: number;
}

export function GridLayer({ width, height }: GridLayerProps) {
  const { gridSize, borders, currentFloorId } = useCanvasStore();

  const dots: React.ReactNode[] = [];

  // Get the border for the current floor
  const border = borders.find(b => b.floorId === currentFloorId);

  if (!border) {
    return null; // No grid if no border exists
  }

  // Align grid start to grid spacing for consistent positioning
  const startX = Math.ceil(border.x / gridSize) * gridSize;
  const endX = border.x + border.width;
  const startY = Math.ceil(border.y / gridSize) * gridSize;
  const endY = border.y + border.height;

  // Create subtle dot pattern only inside the border
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      // Only render dots that are actually inside the border
      if (x >= border.x && x <= border.x + border.width &&
          y >= border.y && y <= border.y + border.height) {
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            x={x}
            y={y}
            radius={2}
            fill="rgba(0, 0, 0, 0.15)"
            listening={false}
          />
        );
      }
    }
  }

  return <>{dots}</>;
}
