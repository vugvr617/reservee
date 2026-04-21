"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { saveStep2 } from "../actions";
import { TimeSlot, VenueData } from "../types";
import { DEFAULT_SCHEDULE } from "../constants";

interface Step2BusinessDetailsProps {
  onNext: () => void;
  onBack: () => void;
  initialData?: VenueData | null;
}

export default function Step2BusinessDetails({
  onNext,
  onBack,
  initialData,
}: Step2BusinessDetailsProps) {
  const [formData, setFormData] = useState({
    fallbackPhone: initialData?.fallbackPhone || "",
  });

  const [schedule, setSchedule] = useState<TimeSlot[]>(
    initialData?.schedule || DEFAULT_SCHEDULE
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await saveStep2({
      ...formData,
      schedule,
    });

    if (result.success) {
      onNext();
    } else {
      setError(result.error || "Something went wrong");
    }

    setIsLoading(false);
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
                    : "bg-white border-gray-200 hover:border-green-200"
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
                  className="ml-auto text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  {slot.closed ? "Open" : "Mark Closed"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            variant="outline"
            className="flex-1 h-12 border-gray-300 rounded-xl text-base font-medium hover:bg-gray-50"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 bg-black hover:bg-gray-900 text-white rounded-xl text-base font-medium shadow-lg shadow-green-400/10 hover:shadow-green-400/20 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </Button>
        </div>
      </form>
    </div>
  );
}
