"use client";

import { useMemo } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  Plus,
  Pencil,
  XCircle,
  Armchair,
  CheckCircle2,
  EyeOff,
  Trash2,
  Bot,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditLogEntry } from "../../activity-log-actions";

interface ActivityTimelineProps {
  logs: AuditLogEntry[];
  isLoading: boolean;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: typeof Plus; dotColor: string; badgeClass: string }
> = {
  created: {
    label: "Reservation created",
    icon: Plus,
    dotColor: "bg-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  modified: {
    label: "Reservation modified",
    icon: Pencil,
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  cancelled: {
    label: "Reservation cancelled",
    icon: XCircle,
    dotColor: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  seated: {
    label: "Guest seated",
    icon: Armchair,
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  completed: {
    label: "Visit completed",
    icon: CheckCircle2,
    dotColor: "bg-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  no_show: {
    label: "Marked no-show",
    icon: EyeOff,
    dotColor: "bg-gray-500",
    badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
  },
  confirmed: {
    label: "Reservation confirmed",
    icon: CheckCircle2,
    dotColor: "bg-green-500",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
  },
  deleted: {
    label: "Reservation deleted",
    icon: Trash2,
    dotColor: "bg-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
};

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action,
      icon: Pencil,
      dotColor: "bg-gray-400",
      badgeClass: "bg-gray-50 text-gray-700 border-gray-200",
    }
  );
}

function formatPerformer(performedBy: string | null): {
  label: string;
  isAi: boolean;
} {
  if (!performedBy || performedBy === "unknown")
    return { label: "System", isAi: false };
  if (performedBy === "ai_call") return { label: "AI Call", isAi: true };
  if (performedBy.startsWith("owner:")) return { label: "Owner", isAi: false };
  if (performedBy.startsWith("staff:")) return { label: "Staff", isAi: false };
  return { label: performedBy, isAi: false };
}

function getGuestName(log: AuditLogEntry): string {
  const values = log.newValues || log.oldValues;
  return (values?.guest_name as string) || "Unknown guest";
}

function getPartySize(log: AuditLogEntry): number | null {
  const values = log.newValues || log.oldValues;
  return (values?.party_size as number) ?? null;
}

function getTableIdentifier(log: AuditLogEntry): string | null {
  const values = log.newValues || log.oldValues;
  return (values?.table_id as string) ? "Assigned" : null;
}

function getReservationTime(log: AuditLogEntry): string | null {
  const values = log.newValues || log.oldValues;
  const date = values?.reservation_date as string;
  const time = values?.reservation_time as string;
  if (!date || !time) return null;

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const formattedTime =
    minutes === 0
      ? `${hour12} ${period}`
      : `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;

  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = format(dateObj, "MMM d");
  return `${formattedDate}, ${formattedTime}`;
}

function getChangeSummary(log: AuditLogEntry): string | null {
  if (log.action !== "modified" || !log.changedFields || !log.oldValues || !log.newValues)
    return null;

  const importantFields = [
    "party_size",
    "reservation_date",
    "reservation_time",
    "table_id",
    "status",
    "guest_name",
    "special_requests",
  ];

  const changes: string[] = [];

  for (const field of log.changedFields) {
    if (!importantFields.includes(field)) continue;
    const oldVal = log.oldValues[field];
    const newVal = log.newValues[field];

    const label = field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (field === "party_size") {
      changes.push(`Party size: ${oldVal} → ${newVal}`);
    } else if (field === "reservation_time") {
      changes.push(`Time: ${oldVal} → ${newVal}`);
    } else if (field === "reservation_date") {
      changes.push(`Date: ${oldVal} → ${newVal}`);
    } else {
      changes.push(`${label} changed`);
    }
  }

  return changes.length > 0 ? changes.join(" · ") : null;
}

function getCancellationReason(log: AuditLogEntry): string | null {
  if (log.action !== "cancelled") return null;
  return (log.newValues?.cancellation_reason as string) || null;
}

function formatDayLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMMM d, yyyy");
}

export function ActivityTimeline({ logs, isLoading }: ActivityTimelineProps) {
  const grouped = useMemo(() => {
    const groups: Record<string, AuditLogEntry[]> = {};
    for (const log of logs) {
      const day = log.createdAt.split("T")[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(log);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [logs]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-100 rounded" />
                <div className="h-3 w-32 bg-gray-100 rounded" />
              </div>
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">
          No activity yet
        </h3>
        <p className="text-sm text-gray-500">
          Activity will appear here when reservations are created, modified, or
          cancelled.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([day, dayLogs]) => (
        <div key={day}>
          {/* Day header */}
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {formatDayLabel(day)}
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">
              {dayLogs.length} event{dayLogs.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Events */}
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {dayLogs.map((log) => {
              const config = getActionConfig(log.action);
              const performer = formatPerformer(log.performedBy);
              const guestName = getGuestName(log);
              const partySize = getPartySize(log);
              const resTime = getReservationTime(log);
              const changeSummary = getChangeSummary(log);
              const cancellationReason = getCancellationReason(log);
              const Icon = config.icon;

              return (
                <div
                  key={log.id}
                  className="px-5 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Icon dot */}
                  <div
                    className={`w-8 h-8 rounded-full ${config.dotColor} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900">
                        {config.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-1.5 py-0 h-5 font-medium ${config.badgeClass}`}
                      >
                        {log.action}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600">
                      {guestName}
                      {partySize ? ` · Party of ${partySize}` : ""}
                      {resTime ? ` · ${resTime}` : ""}
                    </p>

                    {changeSummary && (
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        {changeSummary}
                      </p>
                    )}

                    {cancellationReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Reason: {cancellationReason}
                      </p>
                    )}
                  </div>

                  {/* Right side: performer + time */}
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end mb-0.5">
                      {performer.isAi ? (
                        <Bot className="h-3.5 w-3.5 text-violet-500" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-gray-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${performer.isAi ? "text-violet-600" : "text-gray-500"}`}
                      >
                        {performer.label}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {format(parseISO(log.createdAt), "h:mm a")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
