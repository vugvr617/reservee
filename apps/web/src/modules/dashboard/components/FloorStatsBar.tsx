"use client";

import { Users } from "lucide-react";
import type { FloorStats } from "@/modules/dashboard/utils/table-status";

interface FloorStatsBarProps {
  stats: FloorStats;
  isToday: boolean;
}

interface StatPillProps {
  dotClassName: string;
  label: string;
  value: number;
}

function StatPill({ dotClassName, label, value }: StatPillProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-800">{value}</span>
    </div>
  );
}

export function FloorStatsBar({ stats, isToday }: FloorStatsBarProps) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto border-b border-gray-200 bg-white px-4 py-2.5">
      {/* Table count */}
      <div className="flex shrink-0 items-baseline gap-1.5">
        <span className="text-sm font-bold text-gray-900">{stats.tables}</span>
        <span className="text-sm text-gray-500">tables</span>
      </div>

      <div className="h-4 w-px shrink-0 bg-gray-200" />

      {/* Status breakdown */}
      <div className="flex shrink-0 items-center gap-4">
        <StatPill dotClassName="bg-green-500" label="Seated" value={stats.seated} />
        <StatPill dotClassName="bg-blue-500" label="Reserved" value={stats.reserved} />
        <StatPill dotClassName="bg-gray-300" label="Open" value={stats.open} />
        <StatPill dotClassName="bg-red-500" label="Overdue" value={stats.overdue} />
      </div>

      {/* Covers */}
      <div className="ml-auto flex shrink-0 items-center gap-1.5 text-gray-500">
        <Users className="h-4 w-4" />
        <span className="text-sm font-semibold text-gray-800">{stats.covers}</span>
        <span className="text-sm">covers{isToday ? " tonight" : ""}</span>
      </div>
    </div>
  );
}
