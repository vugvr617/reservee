"use server";

import { supabase } from "@/lib/supabase";
import { getCurrentVenue } from "./get-current-venue";
import {
  getAnalyticsSummary as _getAnalyticsSummary,
  getDailyTrends as _getDailyTrends,
  getHourlyBreakdown as _getHourlyBreakdown,
  getStatusBreakdown as _getStatusBreakdown,
} from "@/lib/domain/analytics/service";

export async function getAnalyticsSummary(startDate: string, endDate: string) {
  const venueId = await getCurrentVenue();
  return _getAnalyticsSummary(supabase, venueId, startDate, endDate);
}

export async function getDailyTrends(startDate: string, endDate: string) {
  const venueId = await getCurrentVenue();
  return _getDailyTrends(supabase, venueId, startDate, endDate);
}

export async function getHourlyBreakdown(startDate: string, endDate: string) {
  const venueId = await getCurrentVenue();
  return _getHourlyBreakdown(supabase, venueId, startDate, endDate);
}

export async function getStatusBreakdown(startDate: string, endDate: string) {
  const venueId = await getCurrentVenue();
  return _getStatusBreakdown(supabase, venueId, startDate, endDate);
}
