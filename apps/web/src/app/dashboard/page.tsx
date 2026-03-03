import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getVenue } from "@/modules/onboarding/actions";
import { getFloorsForVenue, getTablesForFloor } from "@/modules/dashboard/actions";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
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

  // Fetch floors for the venue
  const floorsResult = await getFloorsForVenue(venue.id);
  const floors = floorsResult.success ? floorsResult.data || [] : [];

  // Fetch tables for all floors
  let allTables: any[] = [];
  for (const floor of floors) {
    const tablesResult = await getTablesForFloor(floor.id);
    if (tablesResult.success && tablesResult.data) {
      allTables = [...allTables, ...tablesResult.data];
    }
  }

  return (
    <DashboardClient
      venue={venue}
      initialFloors={floors}
      initialTables={allTables}
    />
  );
}
