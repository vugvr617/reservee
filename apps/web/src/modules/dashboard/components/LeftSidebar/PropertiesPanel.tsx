"use client";

import { useState, useEffect } from "react";
import { Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCanvasStore } from "@/stores/canvas-store";
import { updateTable, deleteTable, createTable } from "@/modules/dashboard/actions";

export function PropertiesPanel() {
  const {
    tables,
    selectedTableId,
    selectTable,
    updateTable: updateTableInStore,
    deleteTable: deleteTableFromStore,
    addTable,
    currentFloorId
  } = useCanvasStore();

  const selectedTable = tables.find((t) => t.id === selectedTableId);

  const [tableIdentifier, setTableIdentifier] = useState("");
  const [minCapacity, setMinCapacity] = useState(1);
  const [maxCapacity, setMaxCapacity] = useState(4);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Update form values when selection changes
  useEffect(() => {
    if (selectedTable) {
      setTableIdentifier(selectedTable.table_identifier);
      setMinCapacity(selectedTable.min_capacity ?? 1);
      setMaxCapacity(selectedTable.max_capacity ?? 4);
      setNotes(selectedTable.notes ?? "");
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
        min_capacity: minCapacity,
        max_capacity: maxCapacity,
        notes: notes,
      });

      // Save to database
      await updateTable(selectedTableId, {
        tableIdentifier,
        minCapacity,
        maxCapacity,
        notes,
      });

      toast.success("Table updated successfully");
    } catch (error) {
      console.error("Failed to update table:", error);
      toast.error("Failed to update table");
      // Revert optimistic update on error
      if (selectedTable) {
        updateTableInStore(selectedTableId, selectedTable);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedTable || !currentFloorId) return;

    setIsDuplicating(true);
    try {
      // Generate new table identifier
      const tableNumber = tables.length + 1;
      const newIdentifier = `Table ${tableNumber}`;

      // Create duplicate table with offset position
      const newTableData = {
        venueId: selectedTable.venue_id,
        floorId: currentFloorId,
        tableIdentifier: newIdentifier,
        positionX: selectedTable.position_x + 20,
        positionY: selectedTable.position_y + 20,
        width: selectedTable.width,
        height: selectedTable.height,
        shape: selectedTable.shape as "square" | "round" | "rectangular" | "oval",
        rotation: selectedTable.rotation ?? 0,
        minCapacity: selectedTable.min_capacity ?? 1,
        maxCapacity: selectedTable.max_capacity ?? 4,
      };

      // Create in database
      const result = await createTable(newTableData);

      if (result.success && result.data) {
        // Add to store
        addTable(result.data);
        // Select the new table
        selectTable(result.data.id);
        toast.success("Table duplicated successfully");
      } else {
        toast.error("Failed to duplicate table");
      }
    } catch (error) {
      console.error("Failed to duplicate table:", error);
      toast.error("Failed to duplicate table");
    } finally {
      setIsDuplicating(false);
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
      toast.success("Table deleted successfully");
    } catch (error) {
      console.error("Failed to delete table:", error);
      toast.error("Failed to delete table");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-6 flex-1">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Table Properties</h3>

          <div className="space-y-4">
            {/* Table ID */}
            <div className="space-y-2">
              <label htmlFor="table-id" className="text-sm font-medium text-gray-700">
                Table ID
              </label>
              <Input
                id="table-id"
                value={tableIdentifier}
                onChange={(e) => setTableIdentifier(e.target.value)}
                placeholder="e.g., Table 1, MF-01"
                className="h-10"
              />
            </div>

            {/* Capacity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="min-capacity" className="text-sm font-medium text-gray-700">
                  Min
                </label>
                <Input
                  id="min-capacity"
                  type="text"
                  inputMode="numeric"
                  value={minCapacity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value === '') {
                      setMinCapacity(0);
                    } else {
                      setMinCapacity(Number(value));
                    }
                  }}
                  onBlur={() => {
                    if (minCapacity < 1) {
                      setMinCapacity(1);
                    }
                  }}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="max-capacity" className="text-sm font-medium text-gray-700">
                  Max
                </label>
                <Input
                  id="max-capacity"
                  type="text"
                  inputMode="numeric"
                  value={maxCapacity}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value === '') {
                      setMaxCapacity(0);
                    } else {
                      setMaxCapacity(Number(value));
                    }
                  }}
                  onBlur={() => {
                    if (maxCapacity < minCapacity) {
                      setMaxCapacity(Math.max(minCapacity, 1));
                    }
                  }}
                  className="h-10"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes
              </label>
              <p className="text-xs text-gray-500 -mt-1">
                Important for AI reservations - helps the bot understand table location and context
              </p>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Add details about this table (e.g., next to balcony, near window)"
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="px-6 py-4 space-y-2 border-t">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-10 bg-lime-500 hover:bg-lime-600 text-white font-medium"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
        <Button
          onClick={handleDuplicate}
          disabled={isDuplicating}
          variant="outline"
          className="w-full h-10 font-medium"
        >
          <Copy className="h-4 w-4 mr-2" />
          {isDuplicating ? "Duplicating..." : "Duplicate Table"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleDelete}
          className="w-full h-10 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Table
        </Button>
      </div>
    </div>
  );
}
