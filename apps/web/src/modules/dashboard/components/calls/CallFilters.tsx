"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CallFiltersProps {
  outcome: string;
  onOutcomeChange: (outcome: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  phoneSearch: string;
  onPhoneSearchChange: (search: string) => void;
  onClearFilters: () => void;
}

export function CallFilters({
  outcome,
  onOutcomeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  phoneSearch,
  onPhoneSearchChange,
  onClearFilters,
}: CallFiltersProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const hasFilters = outcome !== "all" || dateFrom || dateTo || phoneSearch;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date From */}
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-normal">
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateFrom ? format(new Date(dateFrom), "MMM d, yyyy") : "From date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <Calendar
            mode="single"
            selected={dateFrom ? new Date(dateFrom) : undefined}
            onSelect={(date) => {
              onDateFromChange(date ? format(date, "yyyy-MM-dd") : "");
              setFromOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover open={toOpen} onOpenChange={setToOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2 text-sm font-normal">
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateTo ? format(new Date(dateTo), "MMM d, yyyy") : "To date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="start">
          <Calendar
            mode="single"
            selected={dateTo ? new Date(dateTo) : undefined}
            onSelect={(date) => {
              onDateToChange(date ? format(date, "yyyy-MM-dd") : "");
              setToOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>

      {/* Outcome filter */}
      <Select value={outcome} onValueChange={onOutcomeChange}>
        <SelectTrigger className="h-9 w-[180px] text-sm">
          <SelectValue placeholder="All outcomes" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All outcomes</SelectItem>
          <SelectItem value="reservation_made">Reservation Made</SelectItem>
          <SelectItem value="reservation_modified">Modified</SelectItem>
          <SelectItem value="reservation_cancelled">Cancelled</SelectItem>
          <SelectItem value="inquiry">Inquiry</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="no_answer">No Answer</SelectItem>
        </SelectContent>
      </Select>

      {/* Phone search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <Input
          placeholder="Search phone..."
          value={phoneSearch}
          onChange={(e) => onPhoneSearchChange(e.target.value)}
          className="h-9 w-[180px] pl-8 text-sm"
        />
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-sm text-gray-500"
          onClick={onClearFilters}
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
