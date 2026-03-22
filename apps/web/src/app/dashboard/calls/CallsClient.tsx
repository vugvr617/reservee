"use client";

import { Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { NavigationSidebar } from "@/modules/dashboard/components/NavigationSidebar";
import { CallsPage } from "@/modules/dashboard/components/calls/CallsPage";

interface CallsClientProps {
  venueId: string;
}

export default function CallsClient({ venueId }: CallsClientProps) {
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
      <CallsPage venueId={venueId} />
    </div>
  );
}
