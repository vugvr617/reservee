"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Building2, Phone, Mail } from "lucide-react";
import { useState } from "react";

interface Step1OwnerInfoProps {
  onNext: () => void;
}

export default function Step1OwnerInfo({ onNext }: Step1OwnerInfoProps) {
  const [formData, setFormData] = useState({
    managerName: "",
    managerEmail: "",
    managerPhone: "",
    venueName: "",
    fallbackPhone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
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
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20"
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
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20"
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
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20"
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
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            Used in AI prompts when speaking with customers
          </p>
        </div>

        {/* Fallback Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="fallbackPhone" className="text-sm font-medium text-gray-700">
            Fallback Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="fallbackPhone"
              type="tel"
              placeholder="+1 (555) 987-6543"
              value={formData.fallbackPhone}
              onChange={(e) => handleChange("fallbackPhone", e.target.value)}
              className="pl-10 h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20"
              required
            />
          </div>
          <p className="text-xs text-gray-500">
            For forwarding calls when AI limit is reached
          </p>
        </div>

        {/* Info card */}
        <div className="bg-lime-50 border border-lime-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <div className="w-8 h-8 bg-lime-100 rounded-lg flex items-center justify-center">
                <span className="text-lime-600 text-sm">💡</span>
              </div>
            </div>
            <div className="flex-1 text-sm">
              <p className="text-gray-700">
                This information helps us personalize your AI assistant and ensure seamless call handling for your restaurant.
              </p>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="w-full h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-lime-400/10 hover:shadow-lime-400/20 transition-all"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}
