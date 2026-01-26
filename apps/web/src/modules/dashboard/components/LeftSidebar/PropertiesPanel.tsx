"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanvasStore } from "@/stores/canvas-store";
import { updateTable, deleteTable } from "@/modules/dashboard/actions";

export function PropertiesPanel() {
  const { tables, selectedTableId, selectTable, updateTable: updateTableInStore, deleteTable: deleteTableFromStore } = useCanvasStore();

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const [tableIdentifier, setTableIdentifier] = useState("");
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [minCapacity, setMinCapacity] = useState(1);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [isSaving, setIsSaving] = useState(false);

  // Update form values when selection changes
  useEffect(() => {
    if (selectedTable) {
      setTableIdentifier(selectedTable.table_identifier);
      setPositionX(selectedTable.position_x);
      setPositionY(selectedTable.position_y);
      setWidth(selectedTable.width);
      setHeight(selectedTable.height);
      setRotation(selectedTable.rotation ?? 0);
      setMinCapacity(selectedTable.min_capacity ?? 1);
      setMaxCapacity(selectedTable.max_capacity ?? 4);
    }
  }, [selectedTable]);

  if (!selectedTable) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Select a table to view properties
      </div>
    );
  }

  const handleSave = async () => {
    if (!selectedTableId) return;

    setIsSaving(true);
    try {
      // Update in store (optimistic)
      updateTableInStore(selectedTableId, {
        table_identifier: tableIdentifier,
        position_x: positionX,
        position_y: positionY,
        width,
        height,
        rotation,
        min_capacity: minCapacity,
        max_capacity: maxCapacity,
      });

      // Save to database
      await updateTable(selectedTableId, {
        tableIdentifier,
        positionX,
        positionY,
        width,
        height,
        rotation,
        minCapacity,
        maxCapacity,
      });
    } catch (error) {
      console.error("Failed to update table:", error);
      // Revert optimistic update on error
      if (selectedTable) {
        updateTableInStore(selectedTableId, selectedTable);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTableId) return;
    if (!confirm("Are you sure you want to delete this table?")) return;

    try {
      // Delete from store (optimistic)
      deleteTableFromStore(selectedTableId);
      selectTable(null);

      // Delete from database
      await deleteTable(selectedTableId);
    } catch (error) {
      console.error("Failed to delete table:", error);
      // Could add error toast here
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Table Properties</h3>

        {/* Table Identifier */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Table ID</label>
          <Input
            value={tableIdentifier}
            onChange={(e) => setTableIdentifier(e.target.value)}
            placeholder="e.g., MF-01"
            className="h-9"
          />
        </div>

        {/* Position */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">X Position</label>
            <Input
              type="number"
              value={positionX}
              onChange={(e) => setPositionX(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Y Position</label>
            <Input
              type="number"
              value={positionY}
              onChange={(e) => setPositionY(Number(e.target.value))}
              className="h-9"
            />
          </div>
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Width</label>
            <Input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={20}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Height</label>
            <Input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={20}
              className="h-9"
            />
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">
            Rotation ({rotation}°)
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-lime-500"
          />
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Min Capacity</label>
            <Input
              type="number"
              value={minCapacity}
              onChange={(e) => setMinCapacity(Number(e.target.value))}
              min={1}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Max Capacity</label>
            <Input
              type="number"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(Number(e.target.value))}
              min={minCapacity}
              className="h-9"
            />
          </div>
        </div>

        {/* Shape (read-only for now) */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Shape</label>
          <div className="h-9 px-3 flex items-center rounded-md bg-gray-100 text-sm text-gray-600 capitalize">
            {selectedTable.shape}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-lime-500 hover:bg-lime-600 text-white"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDelete}
          className="w-full text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Table
        </Button>
      </div>
    </div>
  );
}
