"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Star,
  Ban,
  Phone,
  Mail,
  Loader2,
  Calendar,
  Users,
  FileText,
  MoreHorizontal,
  Pencil,
  Check,
  X,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getGuestsByVenue,
  updateGuest,
  getGuestReservations,
} from "../../guest-actions";
import type { Guest } from "@/lib/domain/reservations/types";

interface GuestsCRMPageProps {
  venueId: string;
}

type FilterType = "all" | "vip" | "blacklisted";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function GuestsCRMPage({ venueId }: GuestsCRMPageProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestReservations, setGuestReservations] = useState<
    Record<string, unknown>[]
  >([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  const loadGuests = useCallback(async () => {
    setLoading(true);
    const result = await getGuestsByVenue({
      search: search || undefined,
      vipOnly: filter === "vip",
      blacklistedOnly: filter === "blacklisted",
      sortBy: "created_at",
      sortOrder: "desc",
    });
    if (result.success && result.data) {
      setGuests(result.data);
    }
    setLoading(false);
  }, [search, filter]);

  useEffect(() => {
    const timer = setTimeout(loadGuests, 300);
    return () => clearTimeout(timer);
  }, [loadGuests]);

  const openGuestDetail = async (guest: Guest) => {
    setSelectedGuest(guest);
    setNotesValue(guest.notes || "");
    setEditingNotes(false);
    setLoadingReservations(true);
    const result = await getGuestReservations(guest.id);
    if (result.success && result.data) {
      setGuestReservations(result.data);
    }
    setLoadingReservations(false);
  };

  const handleToggleVip = async (guest: Guest) => {
    const newVal = !guest.is_vip;
    const result = await updateGuest(guest.id, { is_vip: newVal });
    if (result.success) {
      toast.success(newVal ? "Guest marked as VIP" : "VIP status removed");
      setGuests((prev) =>
        prev.map((g) => (g.id === guest.id ? { ...g, is_vip: newVal } : g))
      );
      if (selectedGuest?.id === guest.id) {
        setSelectedGuest({ ...guest, is_vip: newVal });
      }
    } else {
      toast.error("Failed to update VIP status");
    }
  };

  const handleToggleBlacklist = async (guest: Guest) => {
    const newVal = !guest.is_blacklisted;
    const result = await updateGuest(guest.id, { is_blacklisted: newVal });
    if (result.success) {
      toast.success(
        newVal ? "Guest blacklisted" : "Guest removed from blacklist"
      );
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guest.id ? { ...g, is_blacklisted: newVal } : g
        )
      );
      if (selectedGuest?.id === guest.id) {
        setSelectedGuest({ ...guest, is_blacklisted: newVal });
      }
    } else {
      toast.error("Failed to update blacklist status");
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedGuest) return;
    const result = await updateGuest(selectedGuest.id, {
      notes: notesValue || null,
    });
    if (result.success) {
      toast.success("Notes updated");
      setGuests((prev) =>
        prev.map((g) =>
          g.id === selectedGuest.id ? { ...g, notes: notesValue || null } : g
        )
      );
      setSelectedGuest({ ...selectedGuest, notes: notesValue || null });
      setEditingNotes(false);
    } else {
      toast.error("Failed to update notes");
    }
  };

  const summary = useMemo(() => {
    const total = guests.length;
    const vips = guests.filter((g) => g.is_vip).length;
    const blocked = guests.filter((g) => g.is_blacklisted).length;
    return { total, vips, blocked };
  }, [guests]);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Guests</h1>
              <p className="text-sm text-gray-500">
                Browse, search, and manage your venue&apos;s guests
              </p>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 flex items-center gap-8">
          <StatDot color="bg-gray-900" label="Total guests" value={summary.total} />
          <div className="h-8 w-px bg-gray-200" />
          <StatDot color="bg-amber-500" icon={<Star className="h-3.5 w-3.5 text-amber-500" />} label="VIPs" value={summary.vips} />
          <div className="h-8 w-px bg-gray-200" />
          <StatDot color="bg-red-500" icon={<Ban className="h-3.5 w-3.5 text-red-500" />} label="Blocked" value={summary.blocked} />
        </div>

        {/* Search + filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-gray-200 rounded-lg focus:border-green-400 focus:ring-green-400/20"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(
              [
                { key: "all", label: "All" },
                { key: "vip", label: "VIPs" },
                { key: "blacklisted", label: "Blocked" },
              ] as const
            ).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 text-sm rounded-md transition-colors ${
                  filter === f.key
                    ? "bg-white text-gray-900 shadow-sm font-medium"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Guest list */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-6 w-6 animate-spin text-green-500" />
            </div>
          ) : guests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-medium">No guests found</p>
              <p className="text-xs text-gray-400 mt-1">
                {search
                  ? "Try a different search term"
                  : "Guests are created automatically when reservations are made"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {guests.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  onClick={() => openGuestDetail(guest)}
                  onToggleVip={() => handleToggleVip(guest)}
                  onToggleBlacklist={() => handleToggleBlacklist(guest)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      <Sheet
        open={!!selectedGuest}
        onOpenChange={(open) => {
          if (!open) setSelectedGuest(null);
        }}
      >
        <SheetContent
          side="right"
          className="bg-white w-full sm:max-w-lg p-0 overflow-y-auto"
        >
          {selectedGuest && (
            <>
              <SheetHeader className="p-6 border-b border-gray-200">
                <SheetTitle className="sr-only">
                  {selectedGuest.full_name}
                </SheetTitle>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-lg shrink-0">
                    {getInitials(selectedGuest.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-gray-900 truncate">
                        {selectedGuest.full_name}
                      </h2>
                      {selectedGuest.is_vip && (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
                          <Star className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      )}
                      {selectedGuest.is_blacklisted && (
                        <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                          <Ban className="h-3 w-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {selectedGuest.phone_number}
                      </span>
                      {selectedGuest.email && (
                        <span className="flex items-center gap-2 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{selectedGuest.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick action buttons */}
                <div className="grid grid-cols-2 gap-2 mt-5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleVip(selectedGuest)}
                    className={
                      selectedGuest.is_vip
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }
                  >
                    <Star className="h-3.5 w-3.5 mr-1.5" />
                    {selectedGuest.is_vip ? "Remove VIP" : "Mark as VIP"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleBlacklist(selectedGuest)}
                    className={
                      selectedGuest.is_blacklisted
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }
                  >
                    <Ban className="h-3.5 w-3.5 mr-1.5" />
                    {selectedGuest.is_blacklisted ? "Unblock" : "Block"}
                  </Button>
                </div>
              </SheetHeader>

              {/* Stats */}
              <div className="p-6 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-0 divide-x divide-gray-100 border border-gray-200 rounded-lg">
                  <StatTile
                    dotColor="bg-green-500"
                    value={selectedGuest.total_reservations ?? 0}
                    label="Visits"
                  />
                  <StatTile
                    dotColor="bg-red-500"
                    value={selectedGuest.total_cancellations ?? 0}
                    label="Cancels"
                  />
                  <StatTile
                    dotColor="bg-purple-500"
                    value={selectedGuest.total_no_shows ?? 0}
                    label="No-shows"
                  />
                  <StatTile
                    dotColor="bg-gray-400"
                    value={
                      selectedGuest.last_visit_date
                        ? format(
                            new Date(selectedGuest.last_visit_date),
                            "MMM d"
                          )
                        : "—"
                    }
                    label="Last visit"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    Notes
                  </h3>
                  {!editingNotes ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNotes(true)}
                      className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      {selectedGuest.notes ? "Edit" : "Add"}
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNotes(false);
                          setNotesValue(selectedGuest.notes || "");
                        }}
                        className="h-7 px-2 text-xs text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        className="h-7 px-2 text-xs bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </div>
                  )}
                </div>
                {editingNotes ? (
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={3}
                    placeholder="Add notes about this guest..."
                    className="bg-white border-gray-200 rounded-lg resize-none text-sm focus:border-green-400 focus:ring-green-400/20"
                  />
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedGuest.notes || (
                      <span className="text-gray-400 italic">No notes yet.</span>
                    )}
                  </p>
                )}
              </div>

              {/* Reservation history */}
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  Reservation history
                  {guestReservations.length > 0 && (
                    <span className="text-xs font-normal text-gray-400">
                      · {guestReservations.length}
                    </span>
                  )}
                </h3>
                {loadingReservations ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-green-500" />
                  </div>
                ) : guestReservations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">No reservations yet</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {guestReservations.map((r: any) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex flex-col items-center justify-center shrink-0">
                          <span className="text-[9px] font-medium text-gray-500 uppercase leading-none">
                            {format(new Date(r.reservation_date), "MMM")}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 leading-none mt-0.5">
                            {format(new Date(r.reservation_date), "d")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {r.reservation_time?.slice(0, 5)}
                            <span className="text-gray-300">·</span>
                            <span>Party of {r.party_size}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">
                            {r.tables?.table_identifier && `Table ${r.tables.table_identifier}`}
                            {r.tables?.table_identifier && r.floors?.floor_name && " · "}
                            {r.floors?.floor_name}
                            {!r.tables?.table_identifier && !r.floors?.floor_name && "No table assigned"}
                          </div>
                        </div>
                        <ReservationStatusBadge status={r.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function GuestRow({
  guest,
  onClick,
  onToggleVip,
  onToggleBlacklist,
}: {
  guest: Guest;
  onClick: () => void;
  onToggleVip: () => void;
  onToggleBlacklist: () => void;
}) {
  return (
    <li
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-sm shrink-0">
        {getInitials(guest.full_name)}
      </div>

      {/* Name + contact */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm truncate">
            {guest.full_name}
          </span>
          {guest.is_vip && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 text-[10px] px-1.5 py-0 h-5">
              <Star className="h-2.5 w-2.5 mr-0.5" />
              VIP
            </Badge>
          )}
          {guest.is_blacklisted && (
            <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-[10px] px-1.5 py-0 h-5">
              <Ban className="h-2.5 w-2.5 mr-0.5" />
              Blocked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
          <span className="flex items-center gap-1 truncate">
            <Phone className="h-3 w-3 shrink-0" />
            {guest.phone_number}
          </span>
          {guest.email && (
            <span className="flex items-center gap-1 truncate">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{guest.email}</span>
            </span>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="hidden md:flex items-center gap-5 text-xs text-gray-600 shrink-0">
        <StatInline
          dotColor="bg-green-500"
          value={guest.total_reservations ?? 0}
          label="visits"
        />
        <StatInline
          dotColor="bg-red-500"
          value={guest.total_cancellations ?? 0}
          label="cancels"
        />
        <StatInline
          dotColor="bg-purple-500"
          value={guest.total_no_shows ?? 0}
          label="no-shows"
        />
      </div>

      {/* Last visit */}
      <div className="hidden lg:block text-xs text-gray-500 w-20 text-right shrink-0">
        {guest.last_visit_date
          ? format(new Date(guest.last_visit_date), "MMM d")
          : "—"}
      </div>

      {/* Actions menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white w-48">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onToggleVip();
            }}
          >
            <Star className="h-4 w-4 mr-2" />
            {guest.is_vip ? "Remove VIP" : "Mark as VIP"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onToggleBlacklist();
            }}
          >
            <Ban className="h-4 w-4 mr-2" />
            {guest.is_blacklisted ? "Unblock" : "Block"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function StatDot({
  color,
  icon,
  label,
  value,
}: {
  color: string;
  icon?: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon ? (
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
          {icon}
        </div>
      ) : (
        <span className={`w-2 h-2 rounded-full ${color}`} />
      )}
      <div>
        <div className="text-lg font-semibold text-gray-900 leading-tight">
          {value}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}

function StatInline({
  dotColor,
  value,
  label,
}: {
  dotColor: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className="font-semibold text-gray-900">{value}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

function StatTile({
  dotColor,
  value,
  label,
}: {
  dotColor: string;
  value: number | string;
  label: string;
}) {
  return (
    <div className="p-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="text-lg font-semibold text-gray-900">{value}</span>
      </div>
      <div className="text-[11px] text-gray-500 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

function ReservationStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-50 text-green-700 border-green-200",
    seated: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
    no_show: "bg-purple-50 text-purple-700 border-purple-200",
  };

  const labels: Record<string, string> = {
    completed: "Completed",
    seated: "Seated",
    pending: "Pending",
    cancelled: "Cancelled",
    no_show: "No-show",
  };

  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 h-5 font-medium shrink-0 ${
        styles[status] || "bg-gray-50 text-gray-600 border-gray-200"
      }`}
    >
      {labels[status] || status}
    </Badge>
  );
}
