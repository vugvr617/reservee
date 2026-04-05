"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
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

interface ActivityFiltersProps {
  action: string;
  onActionChange: (action: string) => void;
  performedBy: string;
  onPerformedByChange: (performedBy: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onClearFilters: () => void;
}

export function ActivityFilters({
  action,
  onActionChange,
  performedBy,
  onPerformedByChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onClearFilters,
}: ActivityFiltersProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const hasFilters =
    action !== "all" || performedBy !== "all" || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date From */}
      <Popover open={fromOpen} onOpenChange={setFromOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-sm font-normal"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {dateFrom
              ? format(new Date(dateFrom), "MMM d, yyyy")
              : "From date"}
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
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 text-sm font-normal"
          >
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

      {/* Action filter */}
      <Select value={action} onValueChange={onActionChange}>
        <SelectTrigger className="h-9 w-[160px] text-sm">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All actions</SelectItem>
          <SelectItem value="created">Created</SelectItem>
          <SelectItem value="modified">Modified</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
          <SelectItem value="seated">Seated</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="no_show">No Show</SelectItem>
          <SelectItem value="deleted">Deleted</SelectItem>
        </SelectContent>
      </Select>

      {/* Performed by filter */}
      <Select value={performedBy} onValueChange={onPerformedByChange}>
        <SelectTrigger className="h-9 w-[160px] text-sm">
          <SelectValue placeholder="All actors" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">All actors</SelectItem>
          <SelectItem value="ai_call">AI Call</SelectItem>
          <SelectItem value="owner">Owner</SelectItem>
          <SelectItem value="staff">Staff</SelectItem>
        </SelectContent>
      </Select>

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
