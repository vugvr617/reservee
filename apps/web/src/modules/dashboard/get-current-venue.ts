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

  const { data: venue, error } = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .single();

  if (error || !venue) {
    throw new Error("Venue not found");
  }

  return venue.id;
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
