"use client";

import { format } from "date-fns";
import { Phone, Clock, Calendar, Tag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { CallLog } from "@/lib/domain/call-logs/types";
import { outcomeConfig } from "./CallLogTable";

interface CallTranscriptSheetProps {
  call: (CallLog & { outcome: string }) | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

export function CallTranscriptSheet({ call, open, onOpenChange }: CallTranscriptSheetProps) {
  if (!call) return null;

  const outcome = outcomeConfig[call.outcome] ?? outcomeConfig.inquiry;

  // Filter messages to only show bot/assistant and user messages
  const chatMessages = call.messages?.filter(
    (m) => m.role === "assistant" || m.role === "bot" || m.role === "user"
  ) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg bg-white p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-lg font-semibold text-gray-900">Call Details</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {/* Metadata */}
          <div className="space-y-3 pb-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {call.startedAt
                  ? format(new Date(call.startedAt), "MMM d, yyyy 'at' h:mm a")
                  : "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{call.callerPhone ?? "Unknown"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{formatDuration(call.durationSeconds)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Tag className="h-4 w-4 text-gray-400" />
              <Badge variant="outline" className={outcome.className}>{outcome.label}</Badge>
            </div>
            {call.endedReason && (
              <div className="text-xs text-gray-400">
                Ended: {call.endedReason}
              </div>
            )}
          </div>

          {/* Recording */}
          {call.recordingUrl && (
            <>
              <Separator />
              <div className="py-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Recording</p>
                <audio
                  controls
                  src={call.recordingUrl}
                  className="w-full h-10"
                  preload="none"
                />
              </div>
            </>
          )}

          {/* Summary */}
          {call.summary && (
            <>
              <Separator />
              <div className="py-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Summary</p>
                <p className="text-sm text-gray-600 leading-relaxed">{call.summary}</p>
              </div>
            </>
          )}

          {/* Transcript */}
          {chatMessages.length > 0 && (
            <>
              <Separator />
              <div className="py-4 pb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Transcript</p>
                <div className="space-y-3">
                  {chatMessages.map((entry, i) => {
                    const isAssistant = entry.role === "assistant" || entry.role === "bot";
                    const text = entry.message || entry.content || "";
                    if (!text) return null;
                    return (
                      <div
                        key={i}
                        className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isAssistant
                              ? "bg-gray-100 text-gray-800"
                              : "bg-green-50 text-gray-800"
                          }`}
                        >
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1">
                            {isAssistant ? "AI Agent" : "Caller"}
                          </p>
                          {text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Fallback: raw transcript text */}
          {chatMessages.length === 0 && call.transcript && (
            <>
              <Separator />
              <div className="py-4 pb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Transcript</p>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {call.transcript}
                </p>
              </div>
            </>
          )}

          {/* Empty state */}
          {chatMessages.length === 0 && !call.transcript && (
            <>
              <Separator />
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No transcript available</p>
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
