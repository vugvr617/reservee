"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { updateVenueProfile } from "@/modules/dashboard/settings-actions";
import type { VenueData } from "@/modules/onboarding/types";
import { useUnsavedChangesGuard } from "@/modules/dashboard/hooks/use-unsaved-changes-guard";

interface ProfileSectionProps {
  venue: VenueData;
  onUpdated: () => void;
}

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <header className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
        <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-green-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export function ProfileSection({ venue, onUpdated }: ProfileSectionProps) {
  const initial = {
    managerName: venue.managerName || "",
    managerEmail: venue.managerEmail || "",
    managerPhone: venue.managerPhone || "",
    venueName: venue.venueName || "",
    address: venue.address || "",
    city: venue.city || "",
    country: venue.country || "",
  };
  const [formData, setFormData] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initial);
  useUnsavedChangesGuard(isDirty);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const result = await updateVenueProfile(formData);

    if (result.success) {
      toast.success("Profile updated successfully");
      onUpdated();
    } else {
      toast.error(result.error || "Failed to update profile");
    }

    setIsSaving(false);
  };

  const inputClass =
    "h-11 bg-white border-gray-200 rounded-lg focus:border-green-400 focus:ring-green-400/20";

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {/* Manager */}
      <SectionCard
        icon={User}
        title="Manager Details"
        description="The person running this venue day-to-day — used for account comms and fallback calls."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="managerName" className="text-xs font-medium text-gray-600">
              Full Name
            </Label>
            <Input
              id="managerName"
              type="text"
              value={formData.managerName}
              onChange={(e) => handleChange("managerName", e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="managerEmail" className="text-xs font-medium text-gray-600">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="managerEmail"
                type="email"
                value={formData.managerEmail}
                onChange={(e) => handleChange("managerEmail", e.target.value)}
                className={`pl-10 ${inputClass}`}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="managerPhone" className="text-xs font-medium text-gray-600">
              Phone
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="managerPhone"
                type="tel"
                value={formData.managerPhone}
                onChange={(e) => handleChange("managerPhone", e.target.value)}
                className={`pl-10 ${inputClass}`}
                required
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Venue */}
      <SectionCard
        icon={Building2}
        title="Venue Details"
        description="How your restaurant is identified, both internally and to callers."
      >
        <div className="space-y-1.5">
          <Label htmlFor="venueName" className="text-xs font-medium text-gray-600">
            Venue Name
          </Label>
          <Input
            id="venueName"
            type="text"
            value={formData.venueName}
            onChange={(e) => handleChange("venueName", e.target.value)}
            className={inputClass}
            required
          />
          <p className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1 mt-2">
            <Sparkles className="h-3 w-3" />
            Used by the AI receptionist when greeting customers
          </p>
        </div>
      </SectionCard>

      {/* Location */}
      <SectionCard
        icon={MapPin}
        title="Location"
        description="Where guests find you — shown to callers asking for directions."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-medium text-gray-600">
              Street Address
            </Label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium text-gray-600">
                City
              </Label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-medium text-gray-600">
                Country
              </Label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => handleChange("country", e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Sticky-ish save bar */}
      <div className="sticky bottom-0 z-10 -mx-2 px-2">
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border ${
            isDirty
              ? "bg-white border-green-200 shadow-lg"
              : "bg-white/80 border-gray-200 shadow-sm"
          } backdrop-blur-sm transition-all`}
        >
          <p className="text-sm text-gray-500">
            {isDirty ? (
              <span className="text-gray-700 font-medium">You have unsaved changes</span>
            ) : (
              "All changes saved"
            )}
          </p>
          <Button
            type="submit"
            disabled={!isDirty || isSaving}
            className="bg-green-500 hover:bg-green-600 text-white px-6 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
