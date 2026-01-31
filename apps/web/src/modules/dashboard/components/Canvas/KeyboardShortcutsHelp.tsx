"use client";

import { X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "Navigation",
    shortcuts: [
      { keys: ["Space", "+ Drag"], description: "Pan canvas" },
      { keys: ["+", "/", "="], description: "Zoom in" },
      { keys: ["-"], description: "Zoom out" },
      { keys: ["0"], description: "Reset zoom" },
    ],
  },
  {
    category: "Tools",
    shortcuts: [
      { keys: ["V"], description: "Select tool" },
      { keys: ["H"], description: "Pan tool" },
      { keys: ["B"], description: "Boundary tool" },
      { keys: ["T"], description: "Table tool" },
    ],
  },
  {
    category: "Actions",
    shortcuts: [
      { keys: ["Delete", "/", "⌫"], description: "Delete selected" },
      { keys: ["ESC"], description: "Cancel selection" },
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
    ],
  },
];

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-[380px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(80vh-60px)]">
          {SHORTCUTS.map((section) => (
            <div key={section.category} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-gray-600">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex}>
                          {key === "/" || key === "+" ? (
                            <span className="text-gray-400 text-xs mx-0.5">{key}</span>
                          ) : (
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-gray-100 border border-gray-200 rounded text-xs font-medium text-gray-700">
                              {key}
                            </kbd>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">?</kbd> to toggle this panel
          </p>
        </div>
      </div>
    </div>
  );
}
