import type { Border } from "../types";

/**
 * Check if a table position is fully within the floor border
 * @param tableX - Table's top-left X position
 * @param tableY - Table's top-left Y position
 * @param tableWidth - Table width
 * @param tableHeight - Table height
 * @param border - Floor border rectangle
 * @returns true if table is fully within border, false otherwise
 */
export function isTableWithinBorder(
  tableX: number,
  tableY: number,
  tableWidth: number,
  tableHeight: number,
  border: Border | null | undefined
): boolean {
  // If no border exists, allow placement anywhere (backward compatible)
  if (!border) return true;

  // Check if table's bounding box is fully within border
  const tableRight = tableX + tableWidth;
  const tableBottom = tableY + tableHeight;
  const borderRight = border.x + border.width;
  const borderBottom = border.y + border.height;

  return (
    tableX >= border.x &&
    tableY >= border.y &&
    tableRight <= borderRight &&
    tableBottom <= borderBottom
  );
}

/**
 * Constrain a position to stay within border during drag
 * @param x - Desired X position
 * @param y - Desired Y position
 * @param width - Object width
 * @param height - Object height
 * @param border - Floor border
 * @returns Constrained {x, y} position
 */
export function constrainToBorder(
  x: number,
  y: number,
  width: number,
  height: number,
  border: Border | null | undefined
): { x: number; y: number } {
  if (!border) return { x, y };

  const constrainedX = Math.max(
    border.x,
    Math.min(x, border.x + border.width - width)
  );

  const constrainedY = Math.max(
    border.y,
    Math.min(y, border.y + border.height - height)
  );

  return { x: constrainedX, y: constrainedY };
}
