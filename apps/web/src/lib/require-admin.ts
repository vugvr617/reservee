import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function requireAdminOrRedirect(): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("user")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (data?.role === "staff") {
    redirect("/dashboard");
  }
}
