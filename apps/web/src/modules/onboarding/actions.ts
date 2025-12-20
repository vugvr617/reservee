"use server";

import { supabase } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Step1FormData, Step2FormData, VenueData } from "./types";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function getVenue(): Promise<VenueData | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { data, error } = await supabase
    .from("venue")
    .select("*")
    .eq("userId", session.user.id)
    .single();

  if (error || !data) return null;
  return data as VenueData;
}

export async function saveStep1(formData: Step1FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const existing = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .single();

  if (existing.data) {
    const { error } = await supabase
      .from("venue")
      .update({
        ...formData,
        onboardingStep: 2,
        updatedAt: new Date().toISOString(),
      })
      .eq("userId", session.user.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("venue").insert({
      userId: session.user.id,
      ...formData,
      onboardingStep: 2,
      onboardingStatus: "in-progress",
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function saveStep2(formData: Step2FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("venue")
    .update({
      fallbackPhone: formData.fallbackPhone,
      schedule: formData.schedule,
      onboardingStep: 3,
      updatedAt: new Date().toISOString(),
    })
    .eq("userId", session.user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
