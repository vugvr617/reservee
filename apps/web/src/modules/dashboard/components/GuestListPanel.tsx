"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, X, Edit2, CheckCircle2, Phone, Users, MapPin, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface GuestListPanelProps {
  isCollapsed: boolean;
}

type ReservationStatus = "upcoming" | "seated" | "completed" | "cancelled";
type FilterType = "today" | "upcoming" | "past";

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
  const [filter, setFilter] = useState<FilterType>("today");
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

  // Filter reservations based on selected filter
  const getFilteredReservations = () => {
    const today = "2026-02-01"; // Using current date from system

    let filtered = allReservations;

    switch (filter) {
      case "today":
        filtered = allReservations.filter(r => r.date === today && r.status !== "completed" && r.status !== "cancelled");
        break;
      case "upcoming":
        filtered = allReservations.filter(r => r.date > today && r.status === "upcoming");
        break;
      case "past":
        filtered = allReservations.filter(r => r.status === "completed" || r.status === "cancelled");
        break;
    }

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

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs gap-1 px-2 py-0.5">
            <Clock className="h-3 w-3" />
            Upcoming
          </Badge>
        );
      case "seated":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs gap-1 px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            Seated
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs gap-1 px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs gap-1 px-2 py-0.5">
            <X className="h-3 w-3" />
            Cancelled
          </Badge>
        );
    }
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500";
      case "seated":
        return "bg-green-500";
      case "completed":
        return "bg-gray-400";
      case "cancelled":
        return "bg-red-500";
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
    <div className={`${isCollapsed ? 'w-0' : 'w-80'} shrink-0 bg-white border-l border-gray-200 shadow-lg overflow-hidden transition-all duration-300`}>
      {!isCollapsed && (
        <div className="h-full flex flex-col">
          {/* Header with New Reservation Button */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900">Reservations</h2>
              <Dialog open={isNewReservationOpen} onOpenChange={setIsNewReservationOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 bg-lime-500 hover:bg-lime-600 text-white gap-1.5 shadow-md rounded-full px-4">
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
                      className="flex-1 bg-lime-500 hover:bg-lime-600 text-white gap-2"
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
            <div className="px-4 pt-2">
              <p className="text-xs text-gray-500">Sat, Feb 1, 2026</p>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {/* Search */}
                <div>
                  <Input
                    type="text"
                    placeholder="Search reservations... (name, phone, table)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Filter Chips - Segmented Control with smooth transitions */}
                <div className="inline-flex p-1 bg-gray-100 rounded-lg relative">
                  <button
                    onClick={() => setFilter("today")}
                    className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      filter === "today"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {filter === "today" && (
                      <div className="absolute inset-0 bg-white shadow-sm rounded-md -z-10 transition-all duration-200" />
                    )}
                    Today
                  </button>
                  <button
                    onClick={() => setFilter("upcoming")}
                    className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      filter === "upcoming"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {filter === "upcoming" && (
                      <div className="absolute inset-0 bg-white shadow-sm rounded-md -z-10 transition-all duration-200" />
                    )}
                    Upcoming
                  </button>
                  <button
                    onClick={() => setFilter("past")}
                    className={`relative z-10 px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      filter === "past"
                        ? "text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {filter === "past" && (
                      <div className="absolute inset-0 bg-white shadow-sm rounded-md -z-10 transition-all duration-200" />
                    )}
                    Past
                  </button>
                </div>

                {/* Guest List with Timeline */}
                <div className="space-y-2.5 relative">
                  {/* Timeline line - subtle */}
                  {filteredReservations.length > 0 && (
                    <div className="absolute left-2 top-4 bottom-4 w-px bg-linear-to-b from-gray-200/60 via-gray-300/80 to-gray-200/60" />
                  )}

                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No reservations found</p>
                    </div>
                  ) : (
                    filteredReservations.map((reservation, index) => (
                      <div key={reservation.id} className="relative pl-6">
                        {/* Timeline dot - aligned with the vertical line */}
                        <div className="absolute left-2 top-3.5 z-10 -translate-x-1/2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(reservation.status)} ring-4 ring-white transition-all ${
                            selectedReservation?.id === reservation.id ? 'scale-125 ring-lime-100' : ''
                          }`} />
                        </div>

                        {/* Card - reduced padding */}
                        <div
                          onClick={() => setSelectedReservation(reservation)}
                          className={`p-3 bg-white rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                            selectedReservation?.id === reservation.id
                              ? "border-lime-500 shadow-md ring-2 ring-lime-100 bg-lime-50/30"
                              : "border-gray-200 shadow-sm hover:border-gray-300"
                          }`}
                        >
                          {/* Top row: Name + Status */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-gray-900">
                                {reservation.name}
                              </div>
                              {getStatusBadge(reservation.status)}
                            </div>
                          </div>

                          {/* Middle row: Time + Guests - Visual hierarchy */}
                          <div className="flex items-center gap-3 mb-2 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-900">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-semibold">{reservation.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-normal">{reservation.guests}</span>
                            </div>
                          </div>

                          {/* Bottom row: Table - smaller, less attention */}
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900/5 border border-slate-900/10 rounded-full text-[11px] font-medium text-slate-600">
                            <MapPin className="h-2.5 w-2.5" />
                            {reservation.table} · {reservation.floor}
                          </div>
                        </div>
                      </div>
                    ))
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
                    <div className="flex items-center gap-2 mb-1.5">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedReservation.name}
                      </h2>
                      {getStatusBadge(selectedReservation.status)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(selectedReservation.date)} · {selectedReservation.time} · {selectedReservation.guests} {selectedReservation.guests === 1 ? 'guest' : 'guests'}
                    </p>
                  </div>
                </div>

                {/* Table Info - Prominent */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium">
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
