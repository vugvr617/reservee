"use client";

import { Activity, CalendarCheck, Bot, Users } from "lucide-react";
import type { AuditLogStats } from "../../activity-log-actions";

interface ActivityStatsCardsProps {
  stats: AuditLogStats | undefined;
  isLoading: boolean;
}

export function ActivityStatsCards({ stats, isLoading }: ActivityStatsCardsProps) {
  const cards = [
    {
      label: "Total Events",
      value: stats?.totalEvents ?? 0,
      icon: Activity,
      accent: "from-green-500 to-green-600",
    },
    {
      label: "Today",
      value: stats?.todayEvents ?? 0,
      icon: CalendarCheck,
      accent: "from-blue-500 to-blue-600",
    },
    {
      label: "AI Actions",
      value: stats?.aiActions ?? 0,
      icon: Bot,
      accent: "from-violet-500 to-violet-600",
    },
    {
      label: "Staff Actions",
      value: stats?.staffActions ?? 0,
      icon: Users,
      accent: "from-amber-500 to-amber-600",
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
          <div
            className={`w-10 h-10 rounded-lg bg-linear-to-br ${card.accent} flex items-center justify-center shrink-0 shadow-sm`}
          >
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
