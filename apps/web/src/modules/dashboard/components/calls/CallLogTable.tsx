"use client";

import { format } from "date-fns";
import { Play, FileText } from "lucide-react";
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
import type { CallLog } from "@/lib/domain/call-logs/types";

type CallWithOutcome = CallLog & { outcome: string };

interface CallLogTableProps {
  calls: CallWithOutcome[];
  onSelectCall: (call: CallWithOutcome) => void;
  isLoading: boolean;
}

export const outcomeConfig: Record<
  string,
  { label: string; className: string }
> = {
  reservation_made: {
    label: "Reservation Made",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  reservation_modified: {
    label: "Modified",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  reservation_cancelled: {
    label: "Cancelled",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  inquiry: {
    label: "Inquiry",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  no_answer: {
    label: "No Answer",
    className: "bg-gray-50 text-gray-600 border-gray-200",
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
    <div className="bg-white rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date & Time</TableHead>
            <TableHead>Caller</TableHead>
            <TableHead className="w-[100px]">Duration</TableHead>
            <TableHead className="w-[160px]">Outcome</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-5 bg-gray-100 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            : calls.map((call) => {
                const outcome = outcomeConfig[call.outcome] ?? outcomeConfig.inquiry;

                return (
                  <TableRow
                    key={call.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => onSelectCall(call)}
                  >
                    <TableCell className="text-sm text-gray-700">
                      {call.startedAt
                        ? format(new Date(call.startedAt), "MMM d, yyyy h:mm a")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 font-mono">
                      {formatPhone(call.callerPhone)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDuration(call.durationSeconds)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={outcome.className}>
                        {outcome.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
