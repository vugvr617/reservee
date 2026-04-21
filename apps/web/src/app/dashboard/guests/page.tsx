import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getVenue } from "@/modules/onboarding/actions";
import GuestsClient from "./GuestsClient";

export default async function GuestsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
  }

  const venue = await getVenue();

  if (!venue || venue.onboardingStatus !== "completed") {
    redirect("/onboarding");
  }

  return <GuestsClient venueId={venue.id} />;
}
