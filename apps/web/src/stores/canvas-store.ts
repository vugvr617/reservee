import { create } from "zustand";
import type {
  Floor,
  CanvasTable,
  Tool,
  TableShape,
  Position,
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

// Simplified Tool type (no walls)
type SimpleTool = "select" | "pan" | "border" | "table";

interface CanvasStore {
  // Floor management
  currentFloorId: string | null;
  floors: Floor[];

  // Tables
  tables: CanvasTable[];
  selectedTableId: string | null;
  dirtyTableIds: Set<string>; // Track tables with unsaved changes

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
  currentTool: SimpleTool;
  tableShape: TableShape;

  // History (undo/redo)
  history: HistoryEntry[];
  historyIndex: number;

  // Floor Actions
  setCurrentFloor: (floorId: string | null) => void;
  setFloors: (floors: Floor[]) => void;
  addFloor: (floor: Floor) => void;
  updateFloor: (floorId: string, updates: Partial<Floor>) => void;
  deleteFloor: (floorId: string) => void;

  // Table Actions
  setTables: (tables: CanvasTable[]) => void;
  addTable: (table: CanvasTable) => void;
  updateTable: (id: string, updates: Partial<CanvasTable>) => void;
  deleteTable: (id: string) => void;
  selectTable: (id: string | null) => void;
  markTableDirty: (id: string) => void;
  clearDirtyTables: () => void;
  getDirtyTables: () => CanvasTable[];

  // Border Actions
  setBorders: (borders: Border[]) => void;
  addBorder: (border: Border) => void;
  updateBorder: (id: string, updates: Partial<Border>) => void;
  deleteBorder: (id: string) => void;
  selectBorder: (id: string | null) => void;
  setIsDrawingBorder: (isDrawing: boolean) => void;
  setTempBorderStart: (position: Position | null) => void;

  // Tool Actions
  setCurrentTool: (tool: SimpleTool) => void;
  setTableShape: (shape: TableShape) => void;

  // Canvas Actions
  setStageScale: (scale: number) => void;
  setStagePosition: (position: Position) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setGridSize: (size: number) => void;

  // History Actions
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
  dirtyTableIds: new Set<string>(),
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
  currentTool: "select" as SimpleTool,
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
      selectedTableId: null,
      selectedBorderId: null,
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

  selectTable: (id) => set({ selectedTableId: id, selectedBorderId: null }),

  markTableDirty: (id) =>
    set((state) => {
      const newDirtyTableIds = new Set(state.dirtyTableIds);
      newDirtyTableIds.add(id);
      return { dirtyTableIds: newDirtyTableIds };
    }),

  clearDirtyTables: () => set({ dirtyTableIds: new Set() }),

  getDirtyTables: () => {
    const state = useCanvasStore.getState();
    return state.tables.filter((table) => state.dirtyTableIds.has(table.id));
  },

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

  selectBorder: (id) => set({ selectedBorderId: id, selectedTableId: null }),
  setIsDrawingBorder: (isDrawing) => set({ isDrawingBorder: isDrawing }),
  setTempBorderStart: (position) => set({ tempBorderStart: position }),

  // Tool actions
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setTableShape: (shape) => set({ tableShape: shape }),

  // Canvas state
  setStageScale: (scale) => set({ stageScale: scale }),
  setStagePosition: (position) => set({ stagePosition: position }),
  setSnapToGrid: (enabled) => set({ snapToGrid: enabled }),
  setGridSize: (size) => set({ gridSize: size }),

  // History (undo/redo) actions
  pushHistory: (entry) =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
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
          newTables = state.tables.filter((t) => t.id !== entry.elementId);
          break;
        case 'table_delete':
          if (entry.before) {
            newTables = [...state.tables, entry.before as CanvasTable];
          }
          break;
        case 'table_move':
        case 'table_update':
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
          if (entry.after) {
            newTables = [...state.tables, entry.after as CanvasTable];
          }
          break;
        case 'table_delete':
          newTables = state.tables.filter((t) => t.id !== entry.elementId);
          break;
        case 'table_move':
        case 'table_update':
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

  canUndo: () => false,
  canRedo: () => false,
  clearHistory: () => set({ history: [], historyIndex: -1 }),

  // Reset
  reset: () => set(initialState),
}));
