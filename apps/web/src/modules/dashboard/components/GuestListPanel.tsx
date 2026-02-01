"use client";

import { useState } from "react";
import { Plus, Calendar, Clock, X, Edit2, CheckCircle2, Phone, Users, MapPin } from "lucide-react";
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
      notes: "Window seat preferred"
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
      notes: "Anniversary dinner"
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

  const handleCreateReservation = () => {
    toast.success("Reservation created successfully");
    setIsNewReservationOpen(false);
  };

  const handleMarkAsSeated = (reservation: Reservation) => {
    toast.success(`${reservation.name} marked as seated`);
    setSelectedReservation(null);
  };

  const handleCancelReservation = (reservation: Reservation) => {
    toast.success(`Reservation for ${reservation.name} cancelled`);
    setSelectedReservation(null);
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
                  <Button size="sm" className="bg-linear-to-r from-lime-500 to-lime-600 hover:from-lime-600 hover:to-lime-700 text-white gap-1.5 shadow-sm">
                    <Plus className="h-4 w-4" />
                    New
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

                {/* Filter Chips - Segmented Control */}
                <div className="inline-flex p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setFilter("today")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      filter === "today"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setFilter("upcoming")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      filter === "upcoming"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setFilter("past")}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      filter === "past"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Past
                  </button>
                </div>

                {/* Guest List with Timeline */}
                <div className="space-y-3 relative">
                  {/* Timeline line */}
                  {filteredReservations.length > 0 && (
                    <div className="absolute left-2 top-6 bottom-6 w-px bg-linear-to-b from-gray-200 via-gray-300 to-gray-200" />
                  )}

                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No reservations found</p>
                    </div>
                  ) : (
                    filteredReservations.map((reservation, index) => (
                      <div key={reservation.id} className="flex gap-3 relative">
                        {/* Timeline dot */}
                        <div className="relative z-10 mt-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(reservation.status)} ring-4 ring-white`} />
                        </div>

                        {/* Card */}
                        <div
                          onClick={() => setSelectedReservation(reservation)}
                          className={`flex-1 p-4 bg-white rounded-2xl border cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                            selectedReservation?.id === reservation.id
                              ? "border-lime-500 shadow-md ring-2 ring-lime-100"
                              : "border-gray-200 shadow-sm hover:border-gray-300"
                          }`}
                        >
                          {/* Top row: Name + Status */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="font-semibold text-gray-900">
                                {reservation.name}
                              </div>
                              {getStatusBadge(reservation.status)}
                            </div>
                          </div>

                          {/* Middle row: Time + Guests - More elegant */}
                          <div className="flex items-center gap-3 mb-3 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Clock className="h-3.5 w-3.5 text-gray-400" />
                              <span className="font-medium">{reservation.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Users className="h-3.5 w-3.5 text-gray-400" />
                              <span>{reservation.guests}</span>
                            </div>
                          </div>

                          {/* Bottom row: Table - Softer design */}
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/5 border border-slate-900/10 rounded-full text-xs font-medium text-slate-700">
                            <MapPin className="h-3 w-3" />
                            {reservation.table} · {reservation.floor}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reservation Details Panel */}
                {selectedReservation && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-sm">Reservation Details</h4>
                      <button
                        onClick={() => setSelectedReservation(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Guest</div>
                        <div className="font-medium">{selectedReservation.name}</div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Contact</div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {selectedReservation.phone}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Date & Time</div>
                          <div>{selectedReservation.time}</div>
                          <div className="text-xs text-gray-600">{selectedReservation.date}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Guests</div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {selectedReservation.guests}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Table</div>
                        <div className="font-semibold">{selectedReservation.table}</div>
                        <div className="text-xs text-gray-600">{selectedReservation.floor}</div>
                      </div>

                      {selectedReservation.notes && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Notes</div>
                          <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                            {selectedReservation.notes}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Actions */}
                      <div className="space-y-2">
                        {selectedReservation.status === "upcoming" && (
                          <Button
                            onClick={() => handleMarkAsSeated(selectedReservation)}
                            className="w-full bg-lime-500 hover:bg-lime-600 text-white gap-2"
                            size="sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark as Seated
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </Button>
                        {selectedReservation.status !== "cancelled" && selectedReservation.status !== "completed" && (
                          <Button
                            onClick={() => handleCancelReservation(selectedReservation)}
                            variant="outline"
                            size="sm"
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Cancel Reservation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
        </div>
      )}
    </div>
  );
}
