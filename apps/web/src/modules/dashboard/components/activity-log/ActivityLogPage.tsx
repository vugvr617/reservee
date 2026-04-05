"use client";

import { useState, useCallback } from "react";
import { Activity } from "lucide-react";
import { useActivityLogs, useActivityLogStats } from "../../hooks/use-activity-logs";
import { ActivityStatsCards } from "./ActivityStatsCards";
import { ActivityFilters } from "./ActivityFilters";
import { ActivityTimeline } from "./ActivityTimeline";
import { Button } from "@/components/ui/button";

interface ActivityLogPageProps {
  venueId: string;
}

export function ActivityLogPage({ venueId }: ActivityLogPageProps) {
  const [action, setAction] = useState("all");
  const [performedBy, setPerformedBy] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [limit, setLimit] = useState(50);

  const { data: logs, isLoading: logsLoading } = useActivityLogs({
    limit,
    action: action !== "all" ? action : undefined,
    performedBy: performedBy !== "all" ? performedBy : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const { data: stats, isLoading: statsLoading } = useActivityLogStats();

  const handleClearFilters = useCallback(() => {
    setAction("all");
    setPerformedBy("all");
    setDateFrom("");
    setDateTo("");
  }, []);

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + 50);
  }, []);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Activity Log
            </h1>
            <p className="text-sm text-gray-500">
              Track all reservation changes across your venue
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <ActivityStatsCards stats={stats} isLoading={statsLoading} />
        </div>

        {/* Filters */}
        <div className="mb-4">
          <ActivityFilters
            action={action}
            onActionChange={setAction}
            performedBy={performedBy}
            onPerformedByChange={setPerformedBy}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Timeline */}
        <ActivityTimeline logs={logs ?? []} isLoading={logsLoading} />

        {/* Load more */}
        {logs && logs.length >= limit && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              className="text-sm"
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
