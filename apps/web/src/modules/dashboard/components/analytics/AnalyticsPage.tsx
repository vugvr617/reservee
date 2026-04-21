"use client";

import { useState, useEffect, useCallback } from "react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  CalendarCheck,
  CircleCheck,
  CircleX,
  UserX,
  Users,
  Flame,
  TrendingUp,
  Clock,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getAnalyticsSummary,
  getDailyTrends,
  getHourlyBreakdown,
  getStatusBreakdown,
} from "../../analytics-actions";
import type {
  AnalyticsSummary,
  DailyTrend,
  HourlyBreakdown,
  StatusBreakdown,
} from "@/lib/domain/analytics/service";

type DateRange = "7d" | "30d" | "this_month" | "90d";

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  seated: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#ef4444",
  no_show: "#eab308",
};

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  seated: "Seated",
  pending: "Pending",
  cancelled: "Cancelled",
  no_show: "No-show",
};

interface AnalyticsPageProps {
  venueId: string;
}

export function AnalyticsPage({ venueId }: AnalyticsPageProps) {
  const [range, setRange] = useState<DateRange>("30d");
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [hourly, setHourly] = useState<HourlyBreakdown[]>([]);
  const [statuses, setStatuses] = useState<StatusBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(
    (r: DateRange): { start: string; end: string } => {
      const today = new Date();
      const end = format(today, "yyyy-MM-dd");
      switch (r) {
        case "7d":
          return { start: format(subDays(today, 7), "yyyy-MM-dd"), end };
        case "30d":
          return { start: format(subDays(today, 30), "yyyy-MM-dd"), end };
        case "this_month":
          return {
            start: format(startOfMonth(today), "yyyy-MM-dd"),
            end: format(endOfMonth(today), "yyyy-MM-dd"),
          };
        case "90d":
          return { start: format(subDays(today, 90), "yyyy-MM-dd"), end };
      }
    },
    []
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { start, end } = getDateRange(range);
      const [summaryRes, trendsRes, hourlyRes, statusRes] = await Promise.all([
        getAnalyticsSummary(start, end),
        getDailyTrends(start, end),
        getHourlyBreakdown(start, end),
        getStatusBreakdown(start, end),
      ]);
      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (trendsRes.success && trendsRes.data) setTrends(trendsRes.data);
      if (hourlyRes.success && hourlyRes.data) setHourly(hourlyRes.data);
      if (statusRes.success && statusRes.data) setStatuses(statusRes.data);
      setLoading(false);
    }
    load();
  }, [range, venueId, getDateRange]);

  const rangeLabels: Record<DateRange, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    this_month: "This month",
    "90d": "Last 90 days",
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Reservation insights and trends
            </p>
          </div>
          <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
            {(Object.keys(rangeLabels) as DateRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  range === r
                    ? "bg-green-500 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Summary Strip */}
            <div className="bg-white rounded-xl border border-gray-200 flex divide-x divide-gray-200 mb-6">
              <StatItem
                value={summary?.totalReservations ?? 0}
                label="Reservations"
                accent="bg-green-500"
                valueColor="text-green-600"
                icon={<CalendarCheck className="h-5 w-5" />}
              />
              <StatItem
                value={summary?.totalCompleted ?? 0}
                label="Completed"
                accent="bg-blue-500"
                valueColor="text-blue-600"
                icon={<CircleCheck className="h-5 w-5" />}
              />
              <StatItem
                value={summary?.totalCancellations ?? 0}
                label="Cancellations"
                accent="bg-red-500"
                valueColor="text-red-600"
                icon={<CircleX className="h-5 w-5" />}
              />
              <StatItem
                value={summary?.totalNoShows ?? 0}
                label="No-shows"
                accent="bg-purple-500"
                valueColor="text-purple-600"
                icon={<UserX className="h-5 w-5" />}
              />
              <StatItem
                value={summary?.avgPartySize ?? 0}
                label="Avg Party Size"
                accent="bg-amber-500"
                valueColor="text-amber-600"
                icon={<Users className="h-5 w-5" />}
              />
              <StatItem
                value={
                  summary?.busiestDay
                    ? format(new Date(summary.busiestDay), "MMM d")
                    : "—"
                }
                label="Busiest Day"
                accent="bg-gray-400"
                valueColor="text-gray-900"
                icon={<Flame className="h-5 w-5" />}
              />
            </div>

            {/* Reservation Trends */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Reservation Trends
                </h2>
              </div>
              <p className="text-xs text-gray-400 mb-4 ml-7">
                Daily reservation volume over time
              </p>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trends} margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillReservations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillCancellations" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fillNoShows" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      tickFormatter={(d) => format(new Date(d), "MMM d")}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(d) => format(new Date(d as string), "MMM d, yyyy")}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "1px solid #e5e7eb",
                        fontSize: "13px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="reservations"
                      stroke="#22c55e"
                      strokeWidth={2.5}
                      fill="url(#fillReservations)"
                      name="Reservations"
                    />
                    <Area
                      type="monotone"
                      dataKey="cancellations"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#fillCancellations)"
                      name="Cancellations"
                    />
                    <Area
                      type="monotone"
                      dataKey="noShows"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#fillNoShows)"
                      name="No-shows"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No reservation data for this period" />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Peak Hours */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Peak Hours
                  </h2>
                </div>
                <p className="text-xs text-gray-400 mb-4 ml-7">
                  Most popular booking times
                </p>
                {hourly.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={hourly} barCategoryGap="20%" margin={{ left: -10, right: 5, top: 5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
                          <stop offset="100%" stopColor="#16a34a" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "10px",
                          border: "1px solid #e5e7eb",
                          fontSize: "13px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                        cursor={{ fill: "rgba(34,197,94,0.06)" }}
                      />
                      <Bar
                        dataKey="count"
                        fill="url(#barGradient)"
                        radius={[6, 6, 0, 0]}
                        name="Reservations"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No data for this period" />
                )}
              </div>

              {/* Status Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <PieChartIcon className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Status Breakdown
                  </h2>
                </div>
                <p className="text-xs text-gray-400 mb-4 ml-7">
                  Reservation outcomes distribution
                </p>
                {statuses.length > 0 ? (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width="45%" height={240}>
                      <PieChart>
                        <Pie
                          data={statuses}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={55}
                          paddingAngle={2}
                          cornerRadius={4}
                        >
                          {statuses.map((entry) => (
                            <Cell
                              key={entry.status}
                              fill={STATUS_COLORS[entry.status] || "#d1d5db"}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            STATUS_LABELS[name as string] || name,
                          ]}
                          contentStyle={{
                            borderRadius: "10px",
                            border: "1px solid #e5e7eb",
                            fontSize: "13px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-3">
                      {statuses.map((s) => {
                        const total = statuses.reduce((sum, x) => sum + x.count, 0);
                        const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                        return (
                          <div key={s.status}>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      STATUS_COLORS[s.status] || "#d1d5db",
                                  }}
                                />
                                <span className="text-gray-700">
                                  {STATUS_LABELS[s.status] || s.status}
                                </span>
                              </div>
                              <span className="font-medium text-gray-900">
                                {s.count}{" "}
                                <span className="text-gray-400 font-normal text-xs">
                                  ({pct}%)
                                </span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-[18px]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor:
                                    STATUS_COLORS[s.status] || "#d1d5db",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <EmptyState message="No data for this period" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatItem({
  value,
  label,
  accent,
  valueColor,
  icon,
}: {
  value: number | string;
  label: string;
  accent: string;
  valueColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-2 h-2 rounded-full ${accent}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className={`flex items-center gap-2 ${valueColor}`}>
        {icon}
        <span className="text-2xl font-semibold">{value}</span>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-60 text-gray-400 text-sm">
      {message}
    </div>
  );
}
