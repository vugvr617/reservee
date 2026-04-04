"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { NavigationSidebar } from "@/modules/dashboard/components/NavigationSidebar";
import { ActivityLogPage } from "@/modules/dashboard/components/activity-log/ActivityLogPage";

interface ActivityLogClientProps {
  venueId: string;
}

export default function ActivityLogClient({ venueId }: ActivityLogClientProps) {
  const { data: session, isPending } = useSession();

  if (isPending || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <NavigationSidebar />
      <ActivityLogPage venueId={venueId} />
    </div>
  );
}
