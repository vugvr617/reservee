"use server";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function getCurrentVenue(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { data: ownVenue } = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .maybeSingle();

  if (ownVenue) return ownVenue.id;

  const { data: userRow } = await supabase
    .from("user")
    .select("staff_venue_id")
    .eq("id", session.user.id)
    .maybeSingle();

  if (userRow?.staff_venue_id) return userRow.staff_venue_id;

  throw new Error("Venue not found");
}

export async function getCurrentPerformer(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return `owner:${session.user.id}`;
}

export async function getCurrentUserRole(): Promise<"admin" | "staff"> {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then((mod) => mod.headers()),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const { data } = await supabase
    .from("user")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  return data?.role === "staff" ? "staff" : "admin";
}
