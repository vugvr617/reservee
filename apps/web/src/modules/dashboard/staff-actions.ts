"use server";

import { randomBytes } from "crypto";
import { hashPassword } from "better-auth/crypto";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { headers } from "next/headers";
import type { StaffActionResult, StaffMember } from "./staff-types";

async function getAdminContext(): Promise<
  | { ok: true; userId: string; venueId: string }
  | { ok: false; error: string }
> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  const { data: userRow } = await supabase
    .from("user")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (userRow?.role && userRow.role !== "admin") {
    return { ok: false, error: "Only admins can manage staff" };
  }

  const { data: venue } = await supabase
    .from("venue")
    .select("id")
    .eq("userId", session.user.id)
    .maybeSingle();

  if (!venue) return { ok: false, error: "Venue not found" };

  return { ok: true, userId: session.user.id, venueId: venue.id };
}

function generateId(length = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export async function listStaffMembers(): Promise<
  StaffActionResult<StaffMember[]>
> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { success: false, error: ctx.error };

  const { data, error } = await supabase
    .from("user")
    .select('id, name, email, "createdAt"')
    .eq("role", "staff")
    .eq("staff_venue_id", ctx.venueId)
    .order("createdAt", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
    })),
  };
}

export async function inviteStaffMember(input: {
  name: string;
  email: string;
  password: string;
}): Promise<StaffActionResult<StaffMember>> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { success: false, error: ctx.error };

  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { success: false, error: "Name is required" };
  if (!email || !/^\S+@\S+\.\S+$/.test(email))
    return { success: false, error: "Enter a valid email" };
  if (!password || password.length < 8)
    return { success: false, error: "Password must be at least 8 characters" };

  const { data: existing } = await supabase
    .from("user")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) return { success: false, error: "A user with that email already exists" };

  const userId = generateId();
  const accountId = generateId();
  const now = new Date().toISOString();

  const { error: userInsertError } = await supabase.from("user").insert({
    id: userId,
    email,
    name,
    emailVerified: true,
    role: "staff",
    staff_venue_id: ctx.venueId,
    createdAt: now,
    updatedAt: now,
  });

  if (userInsertError)
    return { success: false, error: userInsertError.message };

  const passwordHash = await hashPassword(password);

  const { error: accountInsertError } = await supabase.from("account").insert({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  if (accountInsertError) {
    await supabase.from("user").delete().eq("id", userId);
    return { success: false, error: accountInsertError.message };
  }

  return {
    success: true,
    data: { id: userId, name, email, createdAt: now },
  };
}

export async function removeStaffMember(
  staffUserId: string
): Promise<StaffActionResult> {
  const ctx = await getAdminContext();
  if (!ctx.ok) return { success: false, error: ctx.error };

  const { data: target } = await supabase
    .from("user")
    .select("id, role, staff_venue_id")
    .eq("id", staffUserId)
    .maybeSingle();

  if (!target || target.role !== "staff" || target.staff_venue_id !== ctx.venueId) {
    return { success: false, error: "Staff member not found" };
  }

  const { error } = await supabase.from("user").delete().eq("id", staffUserId);
  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}
