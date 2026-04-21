import type { SupabaseClient } from "@supabase/supabase-js";

export interface AnalyticsSummary {
  totalReservations: number;
  totalCancellations: number;
  totalNoShows: number;
  totalCompleted: number;
  avgPartySize: number;
  busiestDay: string | null;
}

export interface DailyTrend {
  date: string;
  reservations: number;
  cancellations: number;
  noShows: number;
}

export interface HourlyBreakdown {
  hour: number;
  label: string;
  count: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export async function getAnalyticsSummary(
  db: SupabaseClient,
  venueId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: AnalyticsSummary; error?: string }> {
  try {
    const { data, error } = await db
      .from("reservations")
      .select("status, party_size, reservation_date")
      .eq("venue_id", venueId)
      .gte("reservation_date", startDate)
      .lte("reservation_date", endDate);

    if (error) throw error;

    const rows = data || [];
    const totalReservations = rows.length;
    const totalCancellations = rows.filter((r) => r.status === "cancelled").length;
    const totalNoShows = rows.filter((r) => r.status === "no_show").length;
    const totalCompleted = rows.filter((r) => r.status === "completed").length;
    const avgPartySize =
      totalReservations > 0
        ? Math.round(
            (rows.reduce((sum, r) => sum + (r.party_size || 0), 0) /
              totalReservations) *
              10
          ) / 10
        : 0;

    // Find busiest day
    const dayCounts: Record<string, number> = {};
    for (const r of rows) {
      if (r.status !== "cancelled") {
        dayCounts[r.reservation_date] =
          (dayCounts[r.reservation_date] || 0) + 1;
      }
    }
    let busiestDay: string | null = null;
    let maxCount = 0;
    for (const [day, count] of Object.entries(dayCounts)) {
      if (count > maxCount) {
        maxCount = count;
        busiestDay = day;
      }
    }

    return {
      success: true,
      data: {
        totalReservations,
        totalCancellations,
        totalNoShows,
        totalCompleted,
        avgPartySize,
        busiestDay,
      },
    };
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    return { success: false, error: "Failed to fetch analytics summary" };
  }
}

export async function getDailyTrends(
  db: SupabaseClient,
  venueId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: DailyTrend[]; error?: string }> {
  try {
    const { data, error } = await db
      .from("reservations")
      .select("reservation_date, status")
      .eq("venue_id", venueId)
      .gte("reservation_date", startDate)
      .lte("reservation_date", endDate);

    if (error) throw error;

    const byDate: Record<
      string,
      { reservations: number; cancellations: number; noShows: number }
    > = {};

    // Fill in all dates in range
    const current = new Date(startDate);
    const end = new Date(endDate);
    while (current <= end) {
      const key = current.toISOString().split("T")[0];
      byDate[key] = { reservations: 0, cancellations: 0, noShows: 0 };
      current.setDate(current.getDate() + 1);
    }

    for (const r of data || []) {
      const entry = byDate[r.reservation_date];
      if (!entry) continue;
      entry.reservations++;
      if (r.status === "cancelled") entry.cancellations++;
      if (r.status === "no_show") entry.noShows++;
    }

    const trends: DailyTrend[] = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    return { success: true, data: trends };
  } catch (error) {
    console.error("Error fetching daily trends:", error);
    return { success: false, error: "Failed to fetch daily trends" };
  }
}

export async function getHourlyBreakdown(
  db: SupabaseClient,
  venueId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: HourlyBreakdown[]; error?: string }> {
  try {
    const { data, error } = await db
      .from("reservations")
      .select("reservation_time")
      .eq("venue_id", venueId)
      .gte("reservation_date", startDate)
      .lte("reservation_date", endDate)
      .neq("status", "cancelled");

    if (error) throw error;

    const hourlyCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyCounts[h] = 0;

    for (const r of data || []) {
      const hour = parseInt(r.reservation_time?.split(":")[0] || "0", 10);
      hourlyCounts[hour]++;
    }

    // Only include hours that have at least 1 reservation, or typical restaurant hours
    const breakdown: HourlyBreakdown[] = Object.entries(hourlyCounts)
      .filter(([h]) => {
        const hour = parseInt(h, 10);
        return hour >= 10 && hour <= 23;
      })
      .map(([h, count]) => {
        const hour = parseInt(h, 10);
        const suffix = hour >= 12 ? "PM" : "AM";
        const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return { hour, label: `${display} ${suffix}`, count };
      });

    return { success: true, data: breakdown };
  } catch (error) {
    console.error("Error fetching hourly breakdown:", error);
    return { success: false, error: "Failed to fetch hourly breakdown" };
  }
}

export async function getStatusBreakdown(
  db: SupabaseClient,
  venueId: string,
  startDate: string,
  endDate: string
): Promise<{ success: boolean; data?: StatusBreakdown[]; error?: string }> {
  try {
    const { data, error } = await db
      .from("reservations")
      .select("status")
      .eq("venue_id", venueId)
      .gte("reservation_date", startDate)
      .lte("reservation_date", endDate);

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const r of data || []) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }

    const breakdown: StatusBreakdown[] = Object.entries(counts).map(
      ([status, count]) => ({ status, count })
    );

    return { success: true, data: breakdown };
  } catch (error) {
    console.error("Error fetching status breakdown:", error);
    return { success: false, error: "Failed to fetch status breakdown" };
  }
}
