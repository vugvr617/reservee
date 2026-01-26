"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolPanel } from "./LeftSidebar/ToolPanel";
import { PropertiesPanel } from "./LeftSidebar/PropertiesPanel";
import { FloorPlanCanvas } from "./Canvas/FloorPlanCanvas";

interface EditModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueId: string;
}

export function EditModeModal({ isOpen, onClose, venueId }: EditModeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Floor Plan</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools */}
          <aside className="w-[360px] bg-gray-50 border-r border-gray-200 overflow-y-auto shrink-0">
            <ToolPanel />
          </aside>

          {/* Canvas Area */}
          <main className="flex-1 relative bg-white min-w-0">
            <FloorPlanCanvas readOnly={false} />
          </main>

          {/* Right Sidebar - Properties */}
          <aside className="w-[400px] bg-gray-50 border-l border-gray-200 overflow-y-auto shrink-0">
            <PropertiesPanel />
          </aside>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={onClose}
            className="bg-lime-500 hover:bg-lime-600 text-white"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
