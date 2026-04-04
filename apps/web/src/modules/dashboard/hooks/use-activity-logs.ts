"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { getAuditLogs, getAuditLogStats } from "../activity-log-actions";

export function useActivityLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  performedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  reservationId?: string;
}) {
  return useQuery({
    queryKey: ["activity-logs", options],
    queryFn: async () => {
      const result = await getAuditLogs(options);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    placeholderData: keepPreviousData,
  });
}

export function useActivityLogStats() {
  return useQuery({
    queryKey: ["activity-log-stats"],
    queryFn: async () => {
      const result = await getAuditLogStats();
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
  });
}
