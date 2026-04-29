import { getVenue } from "@/modules/onboarding/actions";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { data: userRow } = await supabase
    .from("user")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  if (userRow?.role === "staff") {
    redirect("/dashboard");
  }

  const venue = await getVenue();

  if (venue?.onboardingStatus === "completed") {
    redirect("/dashboard");
  }

  return <OnboardingClient initialData={venue} />;
}
