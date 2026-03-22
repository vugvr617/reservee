"use client";

import { useState, useMemo, useCallback } from "react";
import { Phone } from "lucide-react";
import { useCallLogs, useCallStats } from "../../hooks/use-call-logs";
import { CallStatsCards } from "./CallStatsCards";
import { CallFilters } from "./CallFilters";
import { CallLogTable } from "./CallLogTable";
import { CallTranscriptSheet } from "./CallTranscriptSheet";
import type { CallLog } from "@/lib/domain/call-logs/types";

interface CallsPageProps {
  venueId: string;
}

type CallWithOutcome = CallLog & { outcome: string };

export function CallsPage({ venueId }: CallsPageProps) {
  // Filter state
  const [outcome, setOutcome] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");

  // Sheet state
  const [selectedCall, setSelectedCall] = useState<CallWithOutcome | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Data hooks
  const { data: calls, isLoading: callsLoading } = useCallLogs({
    limit: 100,
    createdAtGe: dateFrom || undefined,
    createdAtLe: dateTo ? dateTo + "T23:59:59.999Z" : undefined,
  });
  const { data: stats, isLoading: statsLoading } = useCallStats();

  // Client-side filtering
  const filteredCalls = useMemo(() => {
    let list = calls ?? [];

    if (outcome !== "all") {
      list = list.filter((c) => c.outcome === outcome);
    }

    if (phoneSearch) {
      const search = phoneSearch.toLowerCase();
      list = list.filter(
        (c) => c.callerPhone && c.callerPhone.toLowerCase().includes(search)
      );
    }

    return list;
  }, [calls, outcome, phoneSearch]);

  const handleSelectCall = useCallback((call: CallWithOutcome) => {
    setSelectedCall(call);
    setSheetOpen(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setOutcome("all");
    setDateFrom("");
    setDateTo("");
    setPhoneSearch("");
  }, []);

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
            <Phone className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Call History</h1>
            <p className="text-sm text-gray-500">
              Monitor your AI receptionist&apos;s call activity and performance
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6">
          <CallStatsCards stats={stats} isLoading={statsLoading} />
        </div>

        {/* Filters */}
        <div className="mb-4">
          <CallFilters
            outcome={outcome}
            onOutcomeChange={setOutcome}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            phoneSearch={phoneSearch}
            onPhoneSearchChange={setPhoneSearch}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        <CallLogTable
          calls={filteredCalls}
          onSelectCall={handleSelectCall}
          isLoading={callsLoading}
        />
      </div>

      {/* Transcript Sheet */}
      <CallTranscriptSheet
        call={selectedCall}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
