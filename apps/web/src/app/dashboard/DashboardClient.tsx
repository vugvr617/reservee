"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { VenueData } from "@/modules/onboarding/types";
import { DashboardLayout } from "@/modules/dashboard/components/DashboardLayout";
import type { Floor, TableData } from "@/modules/dashboard/types";

interface DashboardClientProps {
  venue: VenueData;
  initialFloors: Floor[];
  initialTables: TableData[];
}

export default function DashboardClient({
  venue,
  initialFloors,
  initialTables,
}: DashboardClientProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <DashboardLayout
      venueId={venue.id}
      initialFloors={initialFloors}
      initialTables={initialTables}
    />
  );
}
