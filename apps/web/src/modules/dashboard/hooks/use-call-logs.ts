import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  getCallLogs,
  getCallLogById,
  getCallStats,
} from "../call-actions";

export function useCallLogs(options: {
  limit?: number;
  createdAtGe?: string;
  createdAtLe?: string;
}) {
  return useQuery({
    queryKey: ["call-logs", options],
    queryFn: async () => {
      const result = await getCallLogs(options);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCallLogDetail(callId: string | null) {
  return useQuery({
    queryKey: ["call-log", callId],
    queryFn: async () => {
      const result = await getCallLogById(callId!);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!callId,
  });
}

export function useCallStats(options: {
  createdAtGe?: string;
  createdAtLe?: string;
} = {}) {
  return useQuery({
    queryKey: ["call-stats", options],
    queryFn: async () => {
      const result = await getCallStats(options);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
  });
}
