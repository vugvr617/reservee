import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

/**
 * Vercel Cron Job: Auto-transition reservation statuses
 *
 * Runs every 5 minutes. Two transitions:
 * 1. pending → seated: reservation_datetime <= now
 * 2. seated → completed: reservation_datetime + duration_minutes <= now
 *
 * Also updates guest.last_visit_date when marking completed.
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (production)
  // or allow in development
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabase();
  const now = new Date().toISOString();

  try {
    // 1. pending → seated (reservation time has arrived)
    const { data: toSeat, error: seatQueryError } = await db
      .from("reservations")
      .select("id")
      .eq("status", "pending")
      .lte("reservation_datetime", now);

    if (seatQueryError) throw seatQueryError;

    let seatedCount = 0;
    if (toSeat && toSeat.length > 0) {
      const ids = toSeat.map((r) => r.id);
      const { error: seatError } = await db
        .from("reservations")
        .update({ status: "seated", seated_at: now, modified_by: "system:cron" })
        .in("id", ids);

      if (seatError) throw seatError;
      seatedCount = ids.length;
    }

    // 2. seated → completed (reservation time + duration has passed)
    // We need to fetch seated reservations and check duration individually
    const { data: seatedReservations, error: seatedQueryError } = await db
      .from("reservations")
      .select("id, reservation_datetime, duration_minutes, guest_id, reservation_date")
      .eq("status", "seated");

    if (seatedQueryError) throw seatedQueryError;

    const toComplete: { id: string; guestId: string | null; reservationDate: string }[] = [];
    const nowMs = new Date(now).getTime();

    for (const r of seatedReservations || []) {
      const duration = r.duration_minutes || 90;
      const endTime = new Date(r.reservation_datetime).getTime() + duration * 60 * 1000;
      if (nowMs >= endTime) {
        toComplete.push({
          id: r.id,
          guestId: r.guest_id,
          reservationDate: r.reservation_date,
        });
      }
    }

    let completedCount = 0;
    if (toComplete.length > 0) {
      const ids = toComplete.map((r) => r.id);
      const { error: completeError } = await db
        .from("reservations")
        .update({ status: "completed", completed_at: now, modified_by: "system:cron" })
        .in("id", ids);

      if (completeError) throw completeError;
      completedCount = ids.length;

      // Update last_visit_date for guests
      const guestUpdates = toComplete.filter((r) => r.guestId);
      for (const r of guestUpdates) {
        await db
          .from("guests")
          .update({ last_visit_date: r.reservationDate })
          .eq("id", r.guestId!);
      }
    }

    return NextResponse.json({
      success: true,
      seated: seatedCount,
      completed: completedCount,
      timestamp: now,
    });
  } catch (error) {
    console.error("Cron update-reservation-statuses failed:", error);
    return NextResponse.json(
      { error: "Failed to update reservation statuses" },
      { status: 500 }
    );
  }
}
