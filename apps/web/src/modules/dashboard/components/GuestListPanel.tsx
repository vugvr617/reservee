"use client";

import { useState } from "react";
import { Plus, Calendar as CalendarIcon, Clock, X, Edit2, Phone, Users, MapPin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { toast } from "sonner";

interface GuestListPanelProps {
  isCollapsed: boolean;
}

type ReservationStatus = "upcoming" | "seated" | "completed" | "cancelled";

interface Reservation {
  id: number;
  name: string;
  phone: string;
  date: string;
  floor: string;
  table: string;
  guests: number;
  time: string;
  status: ReservationStatus;
  notes?: string;
  tableCapacity?: number;
}

export function GuestListPanel({ isCollapsed }: GuestListPanelProps) {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 1, 1)); // Feb 1, 2026
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);

  // Mock data for reservations with more realistic data
  const allReservations: Reservation[] = [
    {
      id: 1,
      name: "Gretchen Wilson",
      phone: "+1 (555) 123-4567",
      date: "2026-02-01",
      floor: "Main Floor",
      table: "MF-05",
      guests: 6,
      time: "10:30 AM",
      status: "upcoming",
      notes: "Window seat preferred",
      tableCapacity: 6
    },
    {
      id: 2,
      name: "Nolan Chen",
      phone: "+1 (555) 234-5678",
      date: "2026-02-01",
      floor: "Mezzanine",
      table: "MZ-11",
      guests: 4,
      time: "12:00 PM",
      status: "seated",
      tableCapacity: 4
    },
    {
      id: 3,
      name: "Sarah Martinez",
      phone: "+1 (555) 345-6789",
      date: "2026-02-01",
      floor: "Main Floor",
      table: "MF-03",
      guests: 2,
      time: "06:30 PM",
      status: "upcoming",
      notes: "Anniversary dinner",
      tableCapacity: 4
    },
    {
      id: 4,
      name: "James Rodriguez",
      phone: "+1 (555) 456-7890",
      date: "2026-02-03",
      floor: "Patio",
      table: "PT-08",
      guests: 8,
      time: "07:00 PM",
      status: "upcoming",
      tableCapacity: 8
    },
    {
      id: 5,
      name: "Emily Thompson",
      phone: "+1 (555) 567-8901",
      date: "2026-01-31",
      floor: "Main Floor",
      table: "MF-02",
      guests: 4,
      time: "07:30 PM",
      status: "completed",
      tableCapacity: 6
    },
    {
      id: 6,
      name: "Michael Brown",
      phone: "+1 (555) 678-9012",
      date: "2026-01-30",
      floor: "Mezzanine",
      table: "MZ-05",
      guests: 2,
      time: "08:00 PM",
      status: "cancelled",
      tableCapacity: 4
    },
  ];

  // Build a map of date -> reservation count for calendar display
  const reservationCountByDate = allReservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.date] = (acc[r.date] || 0) + 1;
    return acc;
  }, {});

  // Format selected date to YYYY-MM-DD for comparison
  const formatDateToISO = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter reservations based on selected date
  const getFilteredReservations = () => {
    const dateStr = formatDateToISO(selectedDate);

    let filtered = allReservations.filter(r => r.date === dateStr);

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.phone.includes(query) ||
        r.table.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredReservations = getFilteredReservations();

  const getStatusDot = (status: ReservationStatus, isSelected: boolean) => {
    const base = "w-2.5 h-2.5 rounded-full transition-all duration-200";
    const glow = isSelected ? "scale-125" : "";

    switch (status) {
      case "upcoming":
        // Blue ring (hollow)
        return <div className={`${base} ${glow} border-2 border-blue-500 bg-transparent`} />;
      case "seated":
        // Green filled
        return <div className={`${base} ${glow} bg-green-500`} />;
      case "completed":
        // Gray filled
        return <div className={`${base} ${glow} bg-gray-400`} />;
      case "cancelled":
        // Red filled
        return <div className={`${base} ${glow} bg-red-500`} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCreateReservation = () => {
    toast.success("Reservation created successfully");
    setIsNewReservationOpen(false);
  };

  const handleMarkAsSeated = (reservation: Reservation) => {
    toast.success(`${reservation.name} marked as seated`);
    setSelectedReservation(null);
  };

  const handleMarkAsCompleted = (reservation: Reservation) => {
    toast.success(`${reservation.name} marked as completed`);
    setSelectedReservation(null);
  };

  const handleCancelReservation = (reservation: Reservation) => {
    toast.success(`Reservation for ${reservation.name} cancelled`);
    setSelectedReservation(null);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className={`${isCollapsed ? 'w-0' : 'w-80'} shrink-0 bg-white border-l border-gray-200 shadow-lg overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]`}>
      {!isCollapsed && (
        <div className="h-full flex flex-col">
          {/* Header with New Reservation Button */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900">Reservations</h2>
              <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 bg-green-500 hover:bg-green-600 text-white gap-1.5 shadow-md rounded-full px-4">
                    <Plus className="h-3.5 w-3.5" />
                    New Reservation
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>New Reservation</DialogTitle>
                  <DialogDescription>
                    Create a new reservation for your guests.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Guest Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="guestName" className="text-sm">Guest Name</Label>
                    <Input
                      id="guestName"
                      placeholder="e.g., John Smith"
                      className="h-10"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      className="h-10"
                    />
                  </div>

                  {/* Total Guests */}
                  <div className="space-y-1.5">
                    <Label htmlFor="guests" className="text-sm">Total Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      placeholder="e.g., 2"
                      className="h-10"
                    />
                  </div>

                  {/* Date and Time Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-sm">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="time" className="text-sm">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        className="h-10"
                      />
                    </div>
                  </div>

                  {/* Table Assignment */}
                  <div className="space-y-1.5">
                    <Label htmlFor="table" className="text-sm">Table</Label>
                    <Select>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Auto assign or select table" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="auto">Auto assign</SelectItem>
                        <SelectGroup>
                          <SelectLabel>Main Floor</SelectLabel>
                          <SelectItem value="mf-01">MF-01</SelectItem>
                          <SelectItem value="mf-02">MF-02</SelectItem>
                          <SelectItem value="mf-03">MF-03</SelectItem>
                          <SelectItem value="mf-04">MF-04</SelectItem>
                          <SelectItem value="mf-05">MF-05</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Mezzanine</SelectLabel>
                          <SelectItem value="mz-01">MZ-01</SelectItem>
                          <SelectItem value="mz-02">MZ-02</SelectItem>
                          <SelectItem value="mz-11">MZ-11</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Patio</SelectLabel>
                          <SelectItem value="pt-01">PT-01</SelectItem>
                          <SelectItem value="pt-02">PT-02</SelectItem>
                          <SelectItem value="pt-08">PT-08</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Click a table on the canvas to auto-fill
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-sm">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="Special requests, dietary restrictions, etc."
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={handleCreateReservation}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create Reservation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsNewReservationOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {/* Search */}
                <div>
                  <Input
                    type="text"
                    placeholder="Search reservations... (name, phone)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Date Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-9 text-sm"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                      {selectedDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white shadow-lg border border-gray-200 rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          setSelectedDate(date);
                          setCalendarOpen(false);
                        }
                      }}
                      className="[--cell-size:--spacing(10)]"
                      initialFocus
                      components={{
                        DayButton: ({ day, modifiers, children: _children, ...props }) => {
                          const dateStr = formatDateToISO(day.date);
                          const count = reservationCountByDate[dateStr];
                          const isSelected = modifiers.selected;
                          return (
                            <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                              <span className="text-[13px] font-medium">{day.date.getDate()}</span>
                              {count ? (
                                <span className={`text-[9px] leading-none font-semibold ${isSelected ? 'text-white/80' : 'text-green-500'}`}>
                                  {count} res
                                </span>
                              ) : null}
                            </CalendarDayButton>
                          );
                        },
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* Timeline Reservation List */}
                <div className="relative">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No reservations found</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Vertical timeline line - positioned to pass through circle centers */}
                      <div className="absolute left-[69.5px] top-0 bottom-0 w-px bg-gray-200" />

                      {filteredReservations.map((reservation) => {
                        const isSelected = selectedReservation?.id === reservation.id;
                        return (
                          <div
                            key={reservation.id}
                            onClick={() => setSelectedReservation(reservation)}
                            className={`relative flex items-center py-3.5 cursor-pointer transition-colors duration-150 rounded-lg ${
                              isSelected
                                ? "bg-green-50/60"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {/* Selected accent bar */}
                            {isSelected && (
                              <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-green-500" />
                            )}

                            {/* Time - left of the line */}
                            <div className="w-[60px] shrink-0 text-center whitespace-nowrap">
                              <span className="text-[12px] font-semibold text-gray-900 tracking-tight">
                                {reservation.time}
                              </span>
                            </div>

                            {/* Circle on the line */}
                            <div className="relative z-10 w-[18px] shrink-0 flex items-center justify-center">
                              <div className="bg-white p-[3px] rounded-full">
                                {getStatusDot(reservation.status, isSelected)}
                              </div>
                            </div>

                            {/* Reservation details - right of the line */}
                            <div className="flex-1 min-w-0 pl-2.5">
                              <div className="font-semibold text-gray-900 text-[13px] leading-tight truncate">
                                {reservation.name}
                              </div>
                              <div className="text-[11px] text-gray-400 mt-0.5 leading-tight">
                                {reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'}
                                <span className="mx-1 text-gray-300">·</span>
                                {reservation.table}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
        </div>
      )}

      {/* Reservation Details Drawer */}
      <Sheet open={!!selectedReservation} onOpenChange={(open) => !open && setSelectedReservation(null)}>
        <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
          {selectedReservation && (
            <>
              {/* Header - Strong & Compact */}
              <div className="px-5 pt-5 pb-4 border-b">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedReservation.name}
                      </h2>
                      {getStatusDot(selectedReservation.status, false)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedReservation.date)} · {selectedReservation.time} · {selectedReservation.guests} {selectedReservation.guests === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                {/* Table Info - Prominent */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium">
                  <MapPin className="h-3.5 w-3.5" />
                  {selectedReservation.table} · {selectedReservation.floor}
                  {selectedReservation.tableCapacity && (
                    <>
                      <span className="text-gray-400">·</span>
                      <Users className="h-3.5 w-3.5" />
                      {selectedReservation.tableCapacity}
                    </>
                  )}
                </div>
              </div>

              {/* Body - Compact info rows */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-0 divide-y divide-gray-100">
                  {/* Contact Row */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{selectedReservation.phone}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => handleCall(selectedReservation.phone)}
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 gap-1"
                        onClick={() => copyToClipboard(selectedReservation.phone, "Phone number")}
                      >
                        <Copy className="h-3 w-3" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Time Row */}
                  <div className="py-3 flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{selectedReservation.time}</div>
                      <div className="text-xs text-gray-500">{formatDate(selectedReservation.date)}</div>
                    </div>
                  </div>

                  {/* Guests Row */}
                  <div className="py-3 flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedReservation.guests} {selectedReservation.guests === 1 ? 'guest' : 'guests'}
                    </span>
                  </div>

                  {/* Notes Row */}
                  <div className="py-3 flex gap-2.5">
                    <Edit2 className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="flex-1">
                      {selectedReservation.notes ? (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {selectedReservation.notes}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          No notes
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Tight actions */}
              <div className="border-t bg-white px-5 py-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="gap-2 h-9"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleCancelReservation(selectedReservation)}
                    variant="destructive"
                    className="gap-2 h-9"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
