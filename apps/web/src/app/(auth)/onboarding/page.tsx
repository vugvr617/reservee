import { getVenue } from "@/modules/onboarding/actions";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const venue = await getVenue();

  if (venue?.onboardingStatus === "completed") {
    redirect("/dashboard");
  }

  return <OnboardingClient initialData={venue} />;
}
