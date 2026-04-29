import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getVenue } from "@/modules/onboarding/actions";
import { requireAdminOrRedirect } from "@/lib/require-admin";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  await requireAdminOrRedirect();

  const venue = await getVenue();

  if (!venue || venue.onboardingStatus !== "completed") {
    redirect("/onboarding");
  }

  return <SettingsClient venueId={venue.id} />;
}
