"use client";

import { Phone, Clock, TrendingUp, CalendarCheck } from "lucide-react";
import type { CallStats } from "@/lib/domain/call-logs/types";

interface CallStatsCardsProps {
  stats: CallStats | undefined;
  isLoading: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function CallStatsCards({ stats, isLoading }: CallStatsCardsProps) {
  const cards = [
    {
      label: "Total Calls",
      value: stats?.totalCalls ?? 0,
      icon: Phone,
      accent: "from-green-500 to-green-600",
    },
    {
      label: "Avg Duration",
      value: stats ? formatDuration(stats.avgDurationSeconds) : "0s",
      icon: Clock,
      accent: "from-blue-500 to-blue-600",
    },
    {
      label: "Success Rate",
      value: `${stats?.successRate ?? 0}%`,
      icon: TrendingUp,
      accent: "from-green-500 to-green-600",
    },
    {
      label: "Reservations",
      value: stats?.totalReservationsMade ?? 0,
      icon: CalendarCheck,
      accent: "from-green-500 to-green-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 divide-x divide-gray-100 grid grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-6 py-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse shrink-0" />
            <div className="min-w-0 space-y-2">
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              <div className="h-5 w-10 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-x divide-gray-100 grid grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="px-6 py-5 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${card.accent} flex items-center justify-center shrink-0 shadow-sm`}>
            <card.icon className="h-[18px] w-[18px] text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] text-gray-400 font-medium">{card.label}</p>
            <p className="text-xl font-bold text-gray-900 tracking-tight mt-0.5">
              {card.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
