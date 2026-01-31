"use client";

import { Circle } from "react-konva";
import { useCanvasStore } from "@/stores/canvas-store";

interface GridLayerProps {
  width: number;
  height: number;
}

export function GridLayer({ width, height }: GridLayerProps) {
  const { gridSize } = useCanvasStore();

  const dots: React.ReactNode[] = [];

  // Always show grid across entire canvas - use larger bounds to ensure visibility
  const startX = 0;
  const endX = Math.max(width, 3000);
  const startY = 0;
  const endY = Math.max(height, 2500);

  // Create subtle dot pattern across entire canvas
  for (let x = startX; x <= endX; x += gridSize) {
    for (let y = startY; y <= endY; y += gridSize) {
      dots.push(
        <Circle
          key={`dot-${x}-${y}`}
          x={x}
          y={y}
          radius={1.2}
          fill="rgba(0, 0, 0, 0.08)"
          listening={false}
        />
      );
    }
  }

  return <>{dots}</>;
}
