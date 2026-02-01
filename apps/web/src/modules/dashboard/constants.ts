export const DEFAULT_GRID_SIZE = 20;
export const DEFAULT_CANVAS_WIDTH = 1200;
export const DEFAULT_CANVAS_HEIGHT = 800;

export const DEFAULT_TABLE_SIZES = {
  square: { width: 80, height: 80, minCapacity: 1, maxCapacity: 4 },
  round: { width: 80, height: 80, minCapacity: 1, maxCapacity: 4 },
  rectangular: { width: 120, height: 80, minCapacity: 2, maxCapacity: 6 },
  oval: { width: 120, height: 80, minCapacity: 2, maxCapacity: 6 },
} as const;

export const TABLE_STATUS_COLORS = {
  available: "#f5f5f5",
  occupied: "#ff9800",
  reserved: "#22c55e",
} as const;

export const ZOOM_STEP = 0.1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 2;
