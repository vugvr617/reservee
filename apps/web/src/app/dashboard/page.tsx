import { redirect } from "next/navigation";
import { getVenue } from "@/modules/onboarding/actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const venue = await getVenue();

  if (!venue || venue.onboardingStatus !== "completed") {
    redirect("/onboarding");
  }

  return <DashboardClient venue={venue} />;
}
