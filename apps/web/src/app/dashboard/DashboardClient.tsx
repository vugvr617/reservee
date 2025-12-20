"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { VenueData } from "@/modules/onboarding/types";

interface DashboardClientProps {
  venue: VenueData;
}

export default function DashboardClient({ venue }: DashboardClientProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-lime-50/30">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {session.user.name}!</p>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="rounded-xl"
          >
            Sign Out
          </Button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {venue.venueName}
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Manager:</span>
              <p className="text-gray-900 font-medium">{venue.managerName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Address:</span>
              <p className="text-gray-900 font-medium">
                {venue.address}, {venue.city}, {venue.country}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Contact:</span>
              <p className="text-gray-900 font-medium">{venue.managerEmail}</p>
            </div>
          </div>
        </div>

        <div className="bg-lime-50 border border-lime-200 rounded-2xl p-6 mt-6">
          <h3 className="text-lg font-semibold text-lime-900 mb-2">
            Onboarding Complete
          </h3>
          <p className="text-lime-700">
            Your venue is set up and ready to receive reservations.
          </p>
        </div>
      </div>
    </div>
  );
}
