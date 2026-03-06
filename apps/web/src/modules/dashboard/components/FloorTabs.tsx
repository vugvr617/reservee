"use client";

import { Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCanvasStore } from "@/stores/canvas-store";
import { createFloor, updateFloor, deleteFloor } from "@/modules/dashboard/actions";

interface FloorTabsProps {
  venueId: string;
  onEditClick?: () => void;
}

export function FloorTabs({ venueId, onEditClick }: FloorTabsProps) {
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
    <div className="flex items-center justify-between gap-3 bg-white px-4 py-2">
      {/* Floor Tabs */}
      <div className="flex items-center gap-2">
        {floors.map((floor: { id: string; floor_name: string; floor_order: number; venue_id: string }) => {
          const isActive = floor.id === currentFloorId;
          const isEditing = editingFloorId === floor.id;

          return (
            <div
              key={floor.id}
              className="flex items-center gap-2"
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className={`px-3 py-1.5 cursor-pointer transition-colors ${
                  isActive
                    ? "bg-green-500 hover:bg-green-600 border-green-500"
                    : "hover:bg-gray-50"
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                        <MoreVertical className="h-3 w-3" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[120px] bg-white">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingFloorId(floor.id);
                          setEditingFloorName(floor.floor_name);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteFloor(floor.id)}
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              </Badge>
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
              className="bg-green-500 hover:bg-green-600 text-white"
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

      {/* Edit Floor Plan Button */}
      {onEditClick && (
        <Button
          onClick={onEditClick}
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Floor Plan
        </Button>
      )}
    </div>
  );
}
