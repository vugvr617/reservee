import { create } from "zustand";
import type {
  Floor,
  CanvasTable,
  Tool,
  TableShape,
  Position,
  Wall,
  WallType,
  Border,
} from "@/modules/dashboard/types";
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_CANVAS_WIDTH,
  DEFAULT_CANVAS_HEIGHT,
} from "@/modules/dashboard/constants";

// History entry for undo/redo
export interface HistoryEntry {
  type: 'table_create' | 'table_delete' | 'table_move' | 'table_update';
  elementId: string;
  before: Partial<CanvasTable> | null;
  after: Partial<CanvasTable> | null;
}

interface CanvasStore {
  // Floor management
  currentFloorId: string | null;
  floors: Floor[];

  // Tables
  tables: CanvasTable[];
  selectedTableId: string | null;

  // Walls
  walls: Wall[];
  selectedWallId: string | null;
  currentWallType: WallType;
  isDrawingWall: boolean;
  tempWallStart: Position | null;

  // Borders
  borders: Border[];
  selectedBorderId: string | null;
  isDrawingBorder: boolean;
  tempBorderStart: Position | null;

  // Canvas state
  stageScale: number;
  stagePosition: Position;
  snapToGrid: boolean;
  gridSize: number;
  canvasWidth: number;
  canvasHeight: number;

  // Tools
  currentTool: Tool;
  tableShape: TableShape;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  setCurrentFloor: (floorId: string | null) => void;
  setFloors: (floors: Floor[]) => void;
  addFloor: (floor: Floor) => void;
  updateFloor: (floorId: string, updates: Partial<Floor>) => void;
  deleteFloor: (floorId: string) => void;

  setTables: (tables: CanvasTable[]) => void;
  addTable: (table: CanvasTable) => void;
  updateTable: (id: string, updates: Partial<CanvasTable>) => void;
  deleteTable: (id: string) => void;

  selectTable: (id: string | null) => void;
  setCurrentTool: (tool: Tool) => void;
  setTableShape: (shape: TableShape) => void;

  setWalls: (walls: Wall[]) => void;
  addWall: (wall: Wall) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;
  deleteWall: (id: string) => void;
  selectWall: (id: string | null) => void;
  setCurrentWallType: (type: WallType) => void;
  setIsDrawingWall: (isDrawing: boolean) => void;
  setTempWallStart: (position: Position | null) => void;

  setBorders: (borders: Border[]) => void;
  addBorder: (border: Border) => void;
  updateBorder: (id: string, updates: Partial<Border>) => void;
  deleteBorder: (id: string) => void;
  selectBorder: (id: string | null) => void;
  setIsDrawingBorder: (isDrawing: boolean) => void;
  setTempBorderStart: (position: Position | null) => void;

  setStageScale: (scale: number) => void;
  setStagePosition: (position: Position) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;

  // History (undo/redo)
  pushHistory: (entry: HistoryEntry) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentFloorId: null,
  floors: [],
  tables: [],
  selectedTableId: null,
  walls: [],
  selectedWallId: null,
  currentWallType: "external" as WallType,
  isDrawingWall: false,
  tempWallStart: null,
  borders: [],
  selectedBorderId: null,
  isDrawingBorder: false,
  tempBorderStart: null,
  stageScale: 1,
  stagePosition: { x: 0, y: 0 },
  snapToGrid: true,
  gridSize: DEFAULT_GRID_SIZE,
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
  currentTool: "select" as Tool,
  tableShape: "square" as TableShape,
  history: [] as HistoryEntry[],
  historyIndex: -1,
};

export const useCanvasStore = create<CanvasStore>((set) => ({
  ...initialState,

  // Floor actions
  setCurrentFloor: (floorId) =>
    set(() => ({
      currentFloorId: floorId,
      selectedTableId: null, // Deselect table when switching floors
    })),

  setFloors: (floors) => set({ floors }),

  addFloor: (floor) =>
    set((state) => ({
      floors: [...state.floors, floor],
    })),

  updateFloor: (floorId, updates) =>
    set((state) => ({
      floors: state.floors.map((floor) =>
        floor.id === floorId ? { ...floor, ...updates } : floor
      ),
    })),

  deleteFloor: (floorId) =>
    set((state) => ({
      floors: state.floors.filter((floor) => floor.id !== floorId),
      currentFloorId:
        state.currentFloorId === floorId ? null : state.currentFloorId,
    })),

  // Table actions
  setTables: (tables) => set({ tables }),

  addTable: (table) =>
    set((state) => ({
      tables: [...state.tables, table],
    })),

  updateTable: (id, updates) =>
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === id ? { ...table, ...updates } : table
      ),
    })),

  deleteTable: (id) =>
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== id),
      selectedTableId: state.selectedTableId === id ? null : state.selectedTableId,
    })),

  // Selection and tools
  selectTable: (id) => set({ selectedTableId: id }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setTableShape: (shape) => set({ tableShape: shape }),

  // Wall actions
  setWalls: (walls) => set({ walls }),

  addWall: (wall) =>
    set((state) => ({
      walls: [...state.walls, wall],
    })),

  updateWall: (id, updates) =>
    set((state) => ({
      walls: state.walls.map((wall) =>
        wall.id === id ? { ...wall, ...updates } : wall
      ),
    })),

  deleteWall: (id) =>
    set((state) => ({
      walls: state.walls.filter((wall) => wall.id !== id),
      selectedWallId: state.selectedWallId === id ? null : state.selectedWallId,
    })),

  selectWall: (id) => set({ selectedWallId: id }),
  setCurrentWallType: (type) => set({ currentWallType: type }),
  setIsDrawingWall: (isDrawing) => set({ isDrawingWall: isDrawing }),
  setTempWallStart: (position) => set({ tempWallStart: position }),

  // Border actions
  setBorders: (borders) => set({ borders }),

  addBorder: (border) =>
    set((state) => {
      // Only one border per floor - replace if exists
      const existingBorderIndex = state.borders.findIndex(
        (b) => b.floorId === border.floorId
      );
      if (existingBorderIndex !== -1) {
        const newBorders = [...state.borders];
        newBorders[existingBorderIndex] = border;
        return { borders: newBorders };
      }
      return { borders: [...state.borders, border] };
    }),

  updateBorder: (id, updates) =>
    set((state) => ({
      borders: state.borders.map((border) =>
        border.id === id ? { ...border, ...updates } : border
      ),
    })),

  deleteBorder: (id) =>
    set((state) => ({
      borders: state.borders.filter((border) => border.id !== id),
      selectedBorderId: state.selectedBorderId === id ? null : state.selectedBorderId,
    })),

  selectBorder: (id) => set({ selectedBorderId: id }),
  setIsDrawingBorder: (isDrawing) => set({ isDrawingBorder: isDrawing }),
  setTempBorderStart: (position) => set({ tempBorderStart: position }),

  // Canvas state
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePosition: (position) => set({ stagePosition: position }),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setGridSize: (size) => set({ gridSize: size }),

  // History (undo/redo) actions
  pushHistory: (entry) =>
    set((state) => {
      // Remove any redo entries (entries after current index)
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      // Add new entry (limit history to 50 entries)
      newHistory.push(entry);
      if (newHistory.length > 50) {
        newHistory.shift();
        return { history: newHistory, historyIndex: newHistory.length - 1 };
      }
      return { history: newHistory, historyIndex: newHistory.length - 1 };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex < 0) return state;

      const entry = state.history[state.historyIndex];
      let newTables = state.tables;

      switch (entry.type) {
        case 'table_create':
          // Undo create = delete the table
          newTables = state.tables.filter((t) => t.id !== entry.elementId);
          break;
        case 'table_delete':
          // Undo delete = restore the table
          if (entry.before) {
            newTables = [...state.tables, entry.before as CanvasTable];
          }
          break;
        case 'table_move':
        case 'table_update':
          // Undo update = restore previous values
          if (entry.before) {
            newTables = state.tables.map((t) =>
              t.id === entry.elementId ? { ...t, ...entry.before } : t
            );
          }
          break;
      }

      return {
        tables: newTables,
        historyIndex: state.historyIndex - 1,
        selectedTableId: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const entry = state.history[state.historyIndex + 1];
      let newTables = state.tables;

      switch (entry.type) {
        case 'table_create':
          // Redo create = add the table back
          if (entry.after) {
            newTables = [...state.tables, entry.after as CanvasTable];
          }
          break;
        case 'table_delete':
          // Redo delete = remove the table again
          newTables = state.tables.filter((t) => t.id !== entry.elementId);
          break;
        case 'table_move':
        case 'table_update':
          // Redo update = apply the new values
          if (entry.after) {
            newTables = state.tables.map((t) =>
              t.id === entry.elementId ? { ...t, ...entry.after } : t
            );
          }
          break;
      }

      return {
        tables: newTables,
        historyIndex: state.historyIndex + 1,
        selectedTableId: null,
      };
    }),

  canUndo: () => {
    return false; // Use historyIndex state directly in components
  },

  canRedo: () => {
    return false; // Use history.length and historyIndex state directly in components
  },

  clearHistory: () => set({ history: [], historyIndex: -1 }),

  // Reset
  reset: () => set(initialState),
}));
