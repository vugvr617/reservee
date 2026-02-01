"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Phone, Mail, Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { saveStep1 } from "../actions";
import { Step1FormData, VenueData } from "../types";

interface Step1OwnerInfoProps {
  onNext: () => void;
  initialData?: VenueData | null;
}

export default function Step1OwnerInfo({ onNext, initialData }: Step1OwnerInfoProps) {
  const [formData, setFormData] = useState<Step1FormData>({
    managerName: initialData?.managerName || "",
    managerEmail: initialData?.managerEmail || "",
    managerPhone: initialData?.managerPhone || "",
    venueName: initialData?.venueName || "",
    address: initialData?.address || "",
    city: initialData?.city || "Budapest",
    country: initialData?.country || "Hungary",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await saveStep1(formData);

    if (result.success) {
      onNext();
    } else {
      setError(result.error || "Something went wrong");
    }

    setIsLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Let&apos;s get started
        </h1>
        <p className="text-gray-500 mt-1">
          Tell us about you and your venue
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Manager Name */}
        <div className="space-y-2">
          <Label htmlFor="managerName" className="text-sm font-medium text-gray-700">
            Manager Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="managerName"
              type="text"
              placeholder="Jane Smith"
              value={formData.managerName}
              onChange={(e) => handleChange("managerName", e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400/20"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Venue manager for contact & coordination
          </p>
        </div>

        {/* Manager Email */}
        <div className="space-y-2">
          <Label htmlFor="managerEmail" className="text-sm font-medium text-gray-700">
            Manager Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="managerEmail"
              type="email"
              placeholder="manager@restaurant.com"
              value={formData.managerEmail}
              onChange={(e) => handleChange("managerEmail", e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400/20"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            For notifications and updates
          </p>
        </div>

        {/* Manager Phone */}
        <div className="space-y-2">
          <Label htmlFor="managerPhone" className="text-sm font-medium text-gray-700">
            Manager Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="managerPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.managerPhone}
              onChange={(e) => handleChange("managerPhone", e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400/20"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Direct contact for the venue manager
          </p>
        </div>

        {/* Venue Name */}
        <div className="space-y-2">
          <Label htmlFor="venueName" className="text-sm font-medium text-gray-700">
            Venue Name
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="venueName"
              type="text"
              placeholder="The Garden Restaurant"
              value={formData.venueName}
              onChange={(e) => handleChange("venueName", e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400/20"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Used in AI prompts when speaking with customers
          </p>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-gray-700" />
            <Label className="text-base font-semibold text-gray-900">
              Location
            </Label>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Street Address
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="h-12 bg-white border-gray-200 rounded-xl focus:border-green-400 focus:ring-green-400/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                  City
                </Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">💡</span>
              </div>
            </div>
            <div className="flex-1 text-sm">
              <p className="text-gray-700">
                This information helps us personalize your AI assistant and ensure seamless call handling for your restaurant.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-green-400/10 hover:shadow-green-400/20 transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
        </Button>
      </form>
    </div>
  );
}
