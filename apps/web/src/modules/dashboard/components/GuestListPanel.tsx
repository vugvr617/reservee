"use client";

import { useState } from "react";
import { Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GuestListPanel() {
  const [showNewReservation, setShowNewReservation] = useState(false);

  // Mock data for guest list
  const guests = [
    {
      id: 1,
      name: "Gretchen",
      date: "Nov 15",
      floor: "Main Floor",
      table: "MF-05",
      guests: 6,
      time: "10:30 AM",
      status: "confirmed",
    },
    {
      id: 2,
      name: "Nolan",
      date: "Nov 18",
      floor: "Mezzanine",
      table: "MZ-11",
      guests: 4,
      time: "17:00 PM",
      status: "reserved",
    },
  ];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10">
      <div className="p-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search Guests..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500"
          />
        </div>

        {/* Guest List Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Guest List</h3>
          <button className="text-xs text-lime-600 hover:text-lime-700 font-medium">
            View All
          </button>
        </div>

        {/* Guest Items */}
        <div className="space-y-3 mb-6">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-xs text-gray-500">{guest.date}</div>
                  <div className="font-medium text-gray-900">{guest.name}</div>
                  <div className="text-xs text-gray-600">{guest.floor}</div>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    guest.status === "confirmed"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {guest.status === "confirmed" ? "Confirmed" : "Reserved"}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>{guest.table}</span>
                <span>{guest.guests} Guests</span>
                <span>{guest.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* New Reservation Section */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            New Reservation
          </h3>

          <div className="space-y-3">
            {/* Guest Name & Total Guest */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Guest Name
                </label>
                <Input
                  placeholder="e.g., John Smith"
                  className="h-9 text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">
                  Total Guest
                </label>
                <Input
                  placeholder="e.g., 2 guests"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Contact</label>
              <Input
                placeholder="Enter phone number"
                className="h-9 text-sm"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Date</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Select Date"
                    className="h-9 text-sm pr-8"
                  />
                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Time</label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Select Time"
                    className="h-9 text-sm pr-8"
                  />
                  <Clock className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Notes</label>
              <textarea
                placeholder="Add extra details here..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none"
                rows={3}
              />
            </div>

            {/* Create Button */}
            <Button className="w-full bg-lime-500 hover:bg-lime-600 text-white gap-2">
              <Plus className="h-4 w-4" />
              Create Reservation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
