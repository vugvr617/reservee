// Mapped from VAPI Call object for our UI consumption

export interface CallLog {
  id: string;
  assistantId: string | null;
  status: string;
  type: string | null;
  startedAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  callerPhone: string | null;
  recordingUrl: string | null;
  transcript: string | null;
  summary: string | null;
  endedReason: string | null;
  cost: number | null;
  messages: TranscriptMessage[] | null;
}

export interface TranscriptMessage {
  role: "assistant" | "bot" | "user" | "system" | "tool_calls" | "tool_call_result";
  message?: string;
  content?: string;
  time?: number;
  secondsFromStart?: number;
  toolCalls?: Array<{
    function?: { name: string; arguments?: string };
    name?: string;
  }>;
}

export interface CallStats {
  totalCalls: number;
  avgDurationSeconds: number;
  successRate: number;
  totalReservationsMade: number;
}
