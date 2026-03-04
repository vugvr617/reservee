"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  /** The currently selected date+time (or undefined if nothing selected). */
  value?: Date;
  /** Called whenever the user picks/changes date or time. */
  onChange: (date: Date) => void;
  /** Placeholder shown when no value is set. */
  placeholder?: string;
  /** Display format string (date-fns). Defaults to "MMM d, yyyy  h:mm a". */
  displayFormat?: string;
  /** Additional className for the trigger button. */
  className?: string;
  /** Disable the entire picker. */
  disabled?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time",
  displayFormat = "MMM d, yyyy  h:mm a",
  className,
  disabled,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    // Preserve existing time when changing just the date
    const next = new Date(date);
    if (value) {
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    }
    onChange(next);
  };

  const handleTimeChange = (type: "hour" | "minute", val: number) => {
    const base = value ? new Date(value) : new Date();
    if (type === "hour") {
      base.setHours(val);
    } else {
      base.setMinutes(val);
    }
    base.setSeconds(0, 0);
    onChange(base);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
          {value ? format(value, displayFormat) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white" align="start">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x border-t sm:border-t-0 sm:border-l border-gray-200">
            {/* Hours */}
            <ScrollArea className="w-64 sm:w-auto sm:h-[300px]">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={value && value.getHours() === hour ? "default" : "ghost"}
                    className={cn(
                      "sm:w-full shrink-0 aspect-square",
                      value && value.getHours() === hour && "bg-green-500 hover:bg-green-600 text-white"
                    )}
                    onClick={() => handleTimeChange("hour", hour)}
                  >
                    {hour.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            {/* Minutes */}
            <ScrollArea className="w-64 sm:w-auto sm:h-[300px]">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={value && value.getMinutes() === minute ? "default" : "ghost"}
                    className={cn(
                      "sm:w-full shrink-0 aspect-square",
                      value && value.getMinutes() === minute && "bg-green-500 hover:bg-green-600 text-white"
                    )}
                    onClick={() => handleTimeChange("minute", minute)}
                  >
                    {minute.toString().padStart(2, "0")}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
