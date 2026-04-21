"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Clock, Loader2, Copy as CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { updateOperatingHours } from "@/modules/dashboard/settings-actions";
import type { VenueData, TimeSlot } from "@/modules/onboarding/types";
import { DEFAULT_SCHEDULE } from "@/modules/onboarding/constants";
import { useUnsavedChangesGuard } from "@/modules/dashboard/hooks/use-unsaved-changes-guard";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

const WEEKDAYS = new Set(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);

function parseTime(time: string): { hour: string; minute: string } {
  const [hour, minute] = time.split(":");
  const m = parseInt(minute, 10);
  const snapped =
    m < 8 ? "00" : m < 23 ? "15" : m < 38 ? "30" : m < 53 ? "45" : "00";
  return { hour: hour || "09", minute: snapped };
}

function formatTime(hour: string, minute: string): string {
  return `${hour}:${minute}`;
}

function TimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { hour, minute } = parseTime(value);

  return (
    <div className="flex items-center gap-0.5">
      <Select
        value={hour}
        onValueChange={(h) => onChange(formatTime(h, minute))}
        disabled={disabled}
      >
        <SelectTrigger className="w-[62px] h-9 text-sm border-gray-200 tabular-nums">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white max-h-[240px]">
          {HOURS.map((h) => (
            <SelectItem key={h} value={h} className="text-sm tabular-nums">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-gray-300 font-medium px-0.5">:</span>

      <Select
        value={minute}
        onValueChange={(m) => onChange(formatTime(hour, m))}
        disabled={disabled}
      >
        <SelectTrigger className="w-[62px] h-9 text-sm border-gray-200 tabular-nums">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m} className="text-sm tabular-nums">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface OperatingHoursSectionProps {
  venue: VenueData;
  onUpdated: () => void;
}

export function OperatingHoursSection({ venue, onUpdated }: OperatingHoursSectionProps) {
  const initialSchedule = venue.schedule || DEFAULT_SCHEDULE;
  const [schedule, setSchedule] = useState<TimeSlot[]>(initialSchedule);
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(schedule) !== JSON.stringify(initialSchedule);
  useUnsavedChangesGuard(isDirty);

  const toggleDayClosed = (index: number) => {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, closed: !slot.closed } : slot))
    );
  };

  const updateTimeSlot = (index: number, field: "open" | "close", value: string) => {
    setSchedule((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const applyMondayToWeekdays = () => {
    const monday = schedule.find((s) => s.day === "Monday");
    if (!monday) return;
    setSchedule((prev) =>
      prev.map((slot) =>
        WEEKDAYS.has(slot.day)
          ? { ...slot, open: monday.open, close: monday.close, closed: monday.closed }
          : slot
      )
    );
    toast.success("Copied Monday's hours to all weekdays");
  };

  const applyMondayToAll = () => {
    const monday = schedule.find((s) => s.day === "Monday");
    if (!monday) return;
    setSchedule((prev) =>
      prev.map((slot) => ({
        ...slot,
        open: monday.open,
        close: monday.close,
        closed: monday.closed,
      }))
    );
    toast.success("Copied Monday's hours to every day");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const result = await updateOperatingHours({ schedule });

    if (result.success) {
      toast.success("Operating hours updated successfully");
      onUpdated();
    } else {
      toast.error(result.error || "Failed to update operating hours");
    }

    setIsSaving(false);
  };

  const openDaysCount = schedule.filter((s) => !s.closed).length;

  return (
    <form onSubmit={handleSave} className="space-y-5">
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <header className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-transparent">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 leading-snug">
              Weekly Schedule
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {openDaysCount} of 7 days open. Toggle a day off to mark it closed.
            </p>
          </div>
        </header>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-gray-100 bg-gray-50/40">
          <span className="text-xs font-medium text-gray-500 mr-1">Quick copy:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-gray-200"
            onClick={applyMondayToWeekdays}
          >
            <CopyIcon className="h-3 w-3" />
            Monday → Weekdays
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 border-gray-200"
            onClick={applyMondayToAll}
          >
            <CopyIcon className="h-3 w-3" />
            Monday → All Days
          </Button>
        </div>

        <ul className="divide-y divide-gray-100">
          {schedule.map((slot, index) => (
            <li
              key={slot.day}
              className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                slot.closed ? "bg-gray-50/50" : "bg-white"
              }`}
            >
              {/* Switch + Day label */}
              <div className="flex items-center gap-3 w-[180px] shrink-0">
                <Switch
                  checked={!slot.closed}
                  onCheckedChange={() => toggleDayClosed(index)}
                  className="data-[state=checked]:bg-green-500"
                  aria-label={`Toggle ${slot.day}`}
                />
                <div className="min-w-0">
                  <div
                    className={`text-sm font-medium ${
                      slot.closed ? "text-gray-400" : "text-gray-900"
                    }`}
                  >
                    {slot.day}
                  </div>
                  {slot.closed ? (
                    <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
                      Closed
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase tracking-wider text-green-600 font-semibold">
                      Open
                    </div>
                  )}
                </div>
              </div>

              {/* Time range */}
              {!slot.closed ? (
                <div className="flex items-center gap-2">
                  <TimePicker
                    value={slot.open}
                    onChange={(val) => updateTimeSlot(index, "open", val)}
                  />
                  <span className="text-gray-300 text-sm">—</span>
                  <TimePicker
                    value={slot.close}
                    onChange={(val) => updateTimeSlot(index, "close", val)}
                  />
                </div>
              ) : (
                <span className="text-sm text-gray-400 italic">No hours set</span>
              )}

              {/* Summary on the right (read-only at a glance) */}
              <div className="ml-auto hidden sm:flex items-center">
                {!slot.closed && (
                  <span className="text-xs font-mono text-gray-500 tabular-nums bg-gray-50 border border-gray-200 rounded-md px-2 py-1">
                    {slot.open} – {slot.close}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Save bar */}
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
