"use client";

import { VoiceOption } from "@/lib/vapi";
import VoicePreview from "./VoicePreview";

interface VoiceCardProps {
  voice: VoiceOption;
  isSelected: boolean;
  onSelect: () => void;
}

export default function VoiceCard({
  voice,
  isSelected,
  onSelect,
}: VoiceCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`
        p-4 border-2 rounded-xl cursor-pointer transition-all
        ${
          isSelected
            ? "border-lime-400 bg-lime-50"
            : "border-gray-200 hover:border-lime-200 bg-white"
        }
      `}
    >
      {/* Header with name and badges */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{voice.name}</h3>
        <div className="flex gap-1">
          <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
            {voice.gender}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {voice.description}
      </p>

      {/* Category badge */}
      <div className="mb-3">
        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded capitalize">
          {voice.category}
        </span>
      </div>

      {/* Preview Button */}
      <VoicePreview voice={voice} />
    </div>
  );
}
