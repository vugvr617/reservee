"use client";

import { useState, useEffect } from "react";
import { Settings, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getVenueSettings, getPhoneNumberData } from "@/modules/dashboard/settings-actions";
import type { VenueData } from "@/modules/onboarding/types";
import { ProfileSection } from "./ProfileSection";
import { OperatingHoursSection } from "./OperatingHoursSection";
import { AIAgentSection } from "./AIAgentSection";
import { PhoneSection } from "./PhoneSection";
import { TeamSection } from "./TeamSection";

interface SettingsPageProps {
  venueId: string;
}

export function SettingsPage({ venueId }: SettingsPageProps) {
  const [venue, setVenue] = useState<VenueData | null>(null);
  const [phoneData, setPhoneData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [venueResult, phoneResult] = await Promise.all([
      getVenueSettings(),
      getPhoneNumberData(),
    ]);

    if (venueResult.success && venueResult.data) {
      setVenue(venueResult.data);
    }
    if (phoneResult.success && phoneResult.data) {
      setPhoneData(phoneResult.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Failed to load settings.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">
                Manage your venue profile, hours, AI agent, and phone number
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-gray-100 p-1 rounded-lg">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="hours"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
            >
              Operating Hours
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
            >
              AI Agent
            </TabsTrigger>
            <TabsTrigger
              value="phone"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
            >
              Phone Number
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm"
            >
              Team
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSection venue={venue} onUpdated={loadData} />
          </TabsContent>

          <TabsContent value="hours">
            <OperatingHoursSection venue={venue} onUpdated={loadData} />
          </TabsContent>

          <TabsContent value="ai">
            <AIAgentSection venue={venue} onUpdated={loadData} />
          </TabsContent>

          <TabsContent value="phone">
            <PhoneSection venue={venue} phoneData={phoneData} onUpdated={loadData} />
          </TabsContent>

          <TabsContent value="team">
            <TeamSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
