"use client";

import { format } from "date-fns";
import {
  Play,
  FileText,
  CalendarCheck2,
  PencilLine,
  CircleX,
  MessageCircle,
  AlertCircle,
  PhoneOff,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CallLog } from "@/lib/domain/call-logs/types";

type CallWithOutcome = CallLog & { outcome: string };

interface CallLogTableProps {
  calls: CallWithOutcome[];
  onSelectCall: (call: CallWithOutcome) => void;
  isLoading: boolean;
}

export const outcomeConfig: Record<
  string,
  { label: string; className: string; icon: LucideIcon }
> = {
  reservation_made: {
    label: "Reservation Made",
    className: "bg-green-50 text-green-700 border-green-200",
    icon: CalendarCheck2,
  },
  reservation_modified: {
    label: "Modified",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: PencilLine,
  },
  reservation_cancelled: {
    label: "Cancelled",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: CircleX,
  },
  inquiry: {
    label: "Inquiry",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    icon: MessageCircle,
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: AlertCircle,
  },
  no_answer: {
    label: "No Answer",
    className: "bg-gray-50 text-gray-600 border-gray-200",
    icon: PhoneOff,
  },
};

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "Unknown";
  return phone;
}

export function CallLogTable({
  calls,
  onSelectCall,
  isLoading,
}: CallLogTableProps) {
  if (!isLoading && calls.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-1">No calls yet</h3>
        <p className="text-sm text-gray-500">
          When your AI agent handles calls, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/60 hover:bg-gray-50/60">
            <TableHead className="w-[150px] text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              When
            </TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Caller & Summary
            </TableHead>
            <TableHead className="w-[100px] text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Duration
            </TableHead>
            <TableHead className="w-[180px] text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Outcome
            </TableHead>
            <TableHead className="w-[80px] text-right text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="py-4">
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            : calls.map((call) => {
                const outcome = outcomeConfig[call.outcome] ?? outcomeConfig.inquiry;
                const OutcomeIcon = outcome.icon;
                const summary = call.summary?.trim();
                const started = call.startedAt ? new Date(call.startedAt) : null;

                return (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-gray-50/70 transition-colors"
                    onClick={() => onSelectCall(call)}
                  >
                    <TableCell className="py-4 align-top">
                      {started ? (
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium text-gray-900">
                            {format(started, "MMM d")}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(started, "h:mm a")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-mono font-medium text-gray-900 truncate">
                          {formatPhone(call.callerPhone)}
                        </div>
                        {summary ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-gray-500 leading-snug line-clamp-1 max-w-[520px] hover:text-gray-700 transition-colors">
                                {summary}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent
                              side="bottom"
                              align="start"
                              sideOffset={6}
                              className="max-w-sm bg-white text-gray-700 border border-gray-200 shadow-lg rounded-lg p-3 whitespace-normal"
                            >
                              <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                <Sparkles className="h-3 w-3 text-green-500" />
                                Call Summary
                              </div>
                              <p className="text-sm leading-relaxed text-gray-700">
                                {summary}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            No summary available
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top text-sm text-gray-600">
                      {formatDuration(call.durationSeconds)}
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <Badge
                        variant="outline"
                        className={`${outcome.className} gap-1 font-medium`}
                      >
                        <OutcomeIcon className="h-3 w-3" />
                        {outcome.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1">
                        {call.recordingUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCall(call);
                            }}
                            title="Play recording"
                          >
                            <Play className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCall(call);
                          }}
                          title="View transcript"
                        >
                          <FileText className="h-3.5 w-3.5 text-gray-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
