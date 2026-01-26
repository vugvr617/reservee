"use client";

import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCanvasStore } from "@/stores/canvas-store";
import { createFloor, updateFloor, deleteFloor } from "@/modules/dashboard/actions";

export function FloorTabs({ venueId }: { venueId: string }) {
  const { floors, currentFloorId, setCurrentFloor, addFloor, updateFloor: updateFloorInStore, deleteFloor: deleteFloorFromStore } = useCanvasStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newFloorName, setNewFloorName] = useState("");
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingFloorName, setEditingFloorName] = useState("");

  const handleCreateFloor = async () => {
    if (!newFloorName.trim()) return;

    try {
      const result = await createFloor({
        venueId,
        floorName: newFloorName,
        floorOrder: floors.length,
      });

      if (result.success && result.data) {
        addFloor(result.data);
        setCurrentFloor(result.data.id);
        setNewFloorName("");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Failed to create floor:", error);
    }
  };

  const handleUpdateFloor = async (floorId: string) => {
    if (!editingFloorName.trim()) return;

    try {
      const result = await updateFloor(floorId, {
        floorName: editingFloorName,
      });

      if (result.success && result.data) {
        updateFloorInStore(floorId, result.data);
        setEditingFloorId(null);
        setEditingFloorName("");
      }
    } catch (error) {
      console.error("Failed to update floor:", error);
    }
  };

  const handleDeleteFloor = async (floorId: string) => {
    if (!confirm("Are you sure you want to delete this floor?")) return;

    try {
      const result = await deleteFloor(floorId);

      if (result.success) {
        deleteFloorFromStore(floorId);
      }
    } catch (error) {
      console.error("Failed to delete floor:", error);
    }
  };

  return (
    <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-6 py-3">
      {/* Floor Tabs */}
      <div className="flex items-center gap-2 flex-1 overflow-x-auto">
        {floors.map((floor) => {
          const isActive = floor.id === currentFloorId;
          const isEditing = editingFloorId === floor.id;

          return (
            <div
              key={floor.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                isActive
                  ? "bg-lime-50 border-lime-500 text-lime-900"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {isEditing ? (
                <Input
                  value={editingFloorName}
                  onChange={(e) => setEditingFloorName(e.target.value)}
                  onBlur={() => handleUpdateFloor(floor.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdateFloor(floor.id);
                    if (e.key === "Escape") {
                      setEditingFloorId(null);
                      setEditingFloorName("");
                    }
                  }}
                  autoFocus
                  className="h-7 w-32"
                />
              ) : (
                <>
                  <button
                    onClick={() => setCurrentFloor(floor.id)}
                    className="text-sm font-medium"
                  >
                    {floor.floor_name}
                  </button>
                  <div className="relative group">
                    <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                      <MoreVertical className="h-3 w-3" />
                    </button>
                    <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          setEditingFloorId(floor.id);
                          setEditingFloorName(floor.floor_name);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFloor(floor.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Add Floor Button/Input */}
        {isCreating ? (
          <div className="flex items-center gap-2">
            <Input
              value={newFloorName}
              onChange={(e) => setNewFloorName(e.target.value)}
              onBlur={() => {
                if (!newFloorName.trim()) setIsCreating(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFloor();
                if (e.key === "Escape") {
                  setIsCreating(false);
                  setNewFloorName("");
                }
              }}
              placeholder="Floor name"
              autoFocus
              className="h-9 w-40"
            />
            <Button
              size="sm"
              onClick={handleCreateFloor}
              className="bg-lime-500 hover:bg-lime-600 text-white"
            >
              Add
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Floor
          </Button>
        )}
      </div>
    </div>
  );
}
