"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Calendar, Timer, Users, AlertCircle } from "lucide-react";
import { useState } from "react";

interface Step2BusinessDetailsProps {
  onNext: () => void;
  onBack: () => void;
}

interface TimeSlot {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export default function Step2BusinessDetails({
  onNext,
  onBack,
}: Step2BusinessDetailsProps) {
  const [formData, setFormData] = useState({
    reservationWindow: "30",
    reservationDuration: "90",
    maxPartySize: "12",
    minHeadsUp: "1",
  });

  const [schedule, setSchedule] = useState<TimeSlot[]>([
    { day: "Monday", open: "09:00", close: "22:00", closed: false },
    { day: "Tuesday", open: "09:00", close: "22:00", closed: false },
    { day: "Wednesday", open: "09:00", close: "22:00", closed: false },
    { day: "Thursday", open: "09:00", close: "22:00", closed: false },
    { day: "Friday", open: "09:00", close: "22:00", closed: false },
    { day: "Saturday", open: "09:00", close: "22:00", closed: false },
    { day: "Sunday", open: "09:00", close: "22:00", closed: false },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This will be where we save data later
    console.log("Onboarding complete", { formData, schedule });
    alert("Onboarding complete! (Non-functional for now)");
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDayClosed = (index: number) => {
    setSchedule((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, closed: !slot.closed } : slot
      )
    );
  };

  const updateTimeSlot = (index: number, field: "open" | "close", value: string) => {
    setSchedule((prev) =>
      prev.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">
          Business Details
        </h1>
        <p className="text-gray-500 mt-1">
          Set up your reservation policies and hours
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Opening Hours Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-700" />
            <Label className="text-base font-semibold text-gray-900">
              Opening Hours
            </Label>
          </div>

          <div className="space-y-2">
            {schedule.map((slot, index) => (
              <div
                key={slot.day}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  slot.closed
                    ? "bg-gray-50 border-gray-200"
                    : "bg-white border-gray-200 hover:border-lime-200"
                }`}
              >
                <div className="w-28">
                  <span
                    className={`text-sm font-medium ${
                      slot.closed ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {slot.day}
                  </span>
                </div>

                {!slot.closed ? (
                  <>
                    <Input
                      type="time"
                      value={slot.open}
                      onChange={(e) => updateTimeSlot(index, "open", e.target.value)}
                      className="h-10 w-32 border-gray-200 rounded-lg text-sm"
                    />
                    <span className="text-gray-400">—</span>
                    <Input
                      type="time"
                      value={slot.close}
                      onChange={(e) => updateTimeSlot(index, "close", e.target.value)}
                      className="h-10 w-32 border-gray-200 rounded-lg text-sm"
                    />
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Closed</span>
                )}

                <button
                  type="button"
                  onClick={() => toggleDayClosed(index)}
                  className="ml-auto text-xs text-lime-600 hover:text-lime-700 font-medium"
                >
                  {slot.closed ? "Open" : "Mark Closed"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Reservation Policies */}
        <div className="grid grid-cols-2 gap-4">
          {/* Reservation Window */}
          <div className="space-y-2">
            <Label htmlFor="reservationWindow" className="text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Reservation Window
              </div>
            </Label>
            <div className="relative">
              <Input
                id="reservationWindow"
                type="number"
                placeholder="30"
                value={formData.reservationWindow}
                onChange={(e) => handleChange("reservationWindow", e.target.value)}
                className="h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20 pr-16"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                days
              </span>
            </div>
            <p className="text-xs text-gray-500">
              How far in advance can customers book
            </p>
          </div>

          {/* Reservation Duration */}
          <div className="space-y-2">
            <Label htmlFor="reservationDuration" className="text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Reservation Duration
              </div>
            </Label>
            <div className="relative">
              <Input
                id="reservationDuration"
                type="number"
                placeholder="90"
                value={formData.reservationDuration}
                onChange={(e) => handleChange("reservationDuration", e.target.value)}
                className="h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20 pr-16"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                min
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Default table reservation time
            </p>
          </div>

          {/* Max Party Size */}
          <div className="space-y-2">
            <Label htmlFor="maxPartySize" className="text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Max Party Size
              </div>
            </Label>
            <div className="relative">
              <Input
                id="maxPartySize"
                type="number"
                placeholder="12"
                value={formData.maxPartySize}
                onChange={(e) => handleChange("maxPartySize", e.target.value)}
                className="h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20 pr-20"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                guests
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Maximum guests per reservation
            </p>
          </div>

          {/* Min Heads-up */}
          <div className="space-y-2">
            <Label htmlFor="minHeadsUp" className="text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Minimum Heads-up
              </div>
            </Label>
            <div className="relative">
              <Input
                id="minHeadsUp"
                type="number"
                placeholder="1"
                value={formData.minHeadsUp}
                onChange={(e) => handleChange("minHeadsUp", e.target.value)}
                className="h-12 bg-white border-gray-200 rounded-xl focus:border-lime-400 focus:ring-lime-400/20 pr-20"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                hour(s)
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Minimum notice before booking
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onBack}
            variant="outline"
            className="flex-1 h-12 border-gray-300 rounded-xl text-base font-medium hover:bg-gray-50"
          >
            Back
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-lime-400/10 hover:shadow-lime-400/20 transition-all"
          >
            Complete Setup
          </Button>
        </div>
      </form>
    </div>
  );
}
