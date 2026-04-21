"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parse, isToday, parseISO } from "date-fns";
import { Plus, Calendar as CalendarIcon, Ban, Phone, Users, MapPin, Copy, Loader2, Check, CheckCircle2, Trash2, RotateCcw, Pencil, UserX, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { createReservationSchema, type CreateReservationFormValues } from "../schemas";
import type {
  ReservationWithDetails,
  ReservationStatus,
  ReservationDisplayStatus,
  TableOption,
} from "../types";
import {
  useReservationsForDate,
  useReservationCounts,
  useAvailableTables,
  useCreateReservation,
  useUpdateReservation,
  useUpdateReservationStatus,
  useUpdateWalkIn,
  useCancelReservation,
  useDeleteReservation,
} from "../hooks/use-reservations";

interface GuestListPanelProps {
  isCollapsed: boolean;
  venueId: string;
  externalDetailReservation?: ReservationWithDetails | null;
  onExternalDetailConsumed?: () => void;
  externalCreateForTableId?: string | null;
  onExternalCreateConsumed?: () => void;
}

// ============================================
// Helpers
// ============================================

function mapStatusToDisplay(status: ReservationStatus): ReservationDisplayStatus {
  switch (status) {
    case "pending":
      return "upcoming";
    case "seated":
      return "seated";
    case "completed":
      return "completed";
    case "cancelled":
    case "no_show":
      return "cancelled";
  }
}

function formatTime24to12(time24: string): string {
  try {
    // DB may return "HH:mm:ss" — strip seconds for parsing
    const trimmed = time24.length > 5 ? time24.slice(0, 5) : time24;
    const date = parse(trimmed, "HH:mm", new Date());
    return format(date, "h:mm a");
  } catch {
    return time24;
  }
}

function formatDateToISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Build a local Date from "yyyy-MM-dd" + optional "HH:mm".
 * Uses explicit constructor to avoid timezone parsing ambiguity.
 */
function buildLocalDate(dateStr: string, timeStr?: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (timeStr) {
    const [h, min] = timeStr.split(":").map(Number);
    return new Date(y, m - 1, d, h, min, 0, 0);
  }
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function getStatusLabel(status: ReservationStatus): string {
  switch (status) {
    case "pending": return "Pending";
    case "seated": return "Seated";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    case "no_show": return "No Show";
  }
}

type EffectiveStatus = "upcoming" | "likely-seated" | "elapsed" | "seated" | "completed" | "cancelled";

/**
 * Compute the visual status based on DB status + current time.
 * For pending reservations, we infer whether the guest
 * is likely seated (time window active) or done (window expired).
 */
function getEffectiveStatus(
  reservation: { status: ReservationStatus; reservationDate: string; reservationTime: string; durationMinutes: number | null },
  now: Date
): EffectiveStatus {
  // Explicit statuses take priority
  if (reservation.status === "seated") return "seated";
  if (reservation.status === "completed") return "completed";
  if (reservation.status === "cancelled" || reservation.status === "no_show") return "cancelled";

  // For pending, compute based on time
  const [h, m] = reservation.reservationTime.split(":").map(Number);
  const [y, mo, d] = reservation.reservationDate.split("-").map(Number);
  const resStart = new Date(y, mo - 1, d, h, m, 0, 0);
  const duration = reservation.durationMinutes || 90;
  const resEnd = new Date(resStart.getTime() + duration * 60 * 1000);

  if (now >= resEnd) return "elapsed";
  if (now >= resStart) return "likely-seated";
  return "upcoming";
}

function getStatusBadgeClasses(status: ReservationStatus): string {
  const display = mapStatusToDisplay(status);
  switch (display) {
    case "upcoming": return "bg-blue-50 text-blue-700 border-blue-200";
    case "seated": return "bg-green-50 text-green-700 border-green-200";
    case "completed": return "bg-gray-50 text-gray-500 border-gray-200";
    case "cancelled": return "bg-red-50 text-red-600 border-red-200";
  }
}

// ============================================
// Timeline with "Now" marker
// ============================================

function TimelineWithNowMarker({
  reservations,
  now,
  isViewingToday,
  getEffectiveStatusDot,
  onReservationClick,
}: {
  reservations: ReservationWithDetails[];
  now: Date;
  isViewingToday: boolean;
  getEffectiveStatusDot: (r: ReservationWithDetails) => React.ReactNode;
  onReservationClick: (r: ReservationWithDetails) => void;
}) {
  // Find insertion index for the "now" marker
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let nowIndex = -1; // -1 means don't show
  if (isViewingToday) {
    nowIndex = reservations.findIndex((r) => {
      const [h, m] = r.reservationTime.split(":").map(Number);
      return h * 60 + m > nowMinutes;
    });
    // If all reservations are in the past, put marker at the end
    if (nowIndex === -1) {
      // Check if there are any reservations and the last one is past
      const last = reservations[reservations.length - 1];
      if (last) {
        const [h, m] = last.reservationTime.split(":").map(Number);
        if (h * 60 + m <= nowMinutes) {
          nowIndex = reservations.length;
        }
      }
    }
  }

  const nowTime = format(now, "h:mm a");

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      <div className="absolute left-[69.5px] top-0 bottom-0 w-px bg-gray-200" />

      {reservations.map((reservation, idx) => {
        const effective = isViewingToday
          ? getEffectiveStatus(reservation, now)
          : "upcoming";
        const isElapsed = effective === "elapsed";
        const isCompleted = effective === "completed";
        const isLikelySeated = effective === "likely-seated" || effective === "seated";

        return (
          <React.Fragment key={reservation.id}>
            {/* "Now" marker */}
            {isViewingToday && nowIndex === idx && (
              <div className="relative flex items-center py-1.5 my-1">
                <div className="absolute left-[16px] right-[8px] h-px bg-green-400" />
                <div className="relative z-10 ml-[52px] flex items-center gap-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  <Clock className="h-2.5 w-2.5" />
                  {nowTime}
                </div>
              </div>
            )}
            <div
              onClick={() => onReservationClick(reservation)}
              className={`relative flex items-center py-3.5 cursor-pointer transition-colors duration-150 rounded-lg hover:bg-gray-50 ${isElapsed ? "opacity-50" : ""}`}
            >
              <div className="w-[60px] shrink-0 text-center whitespace-nowrap">
                <span
                  className={`text-[12px] font-semibold tracking-tight ${
                    isElapsed ? "text-gray-400" : isCompleted ? "text-gray-600" : "text-gray-900"
                  }`}
                >
                  {formatTime24to12(reservation.reservationTime)}
                </span>
              </div>

              <div className="relative z-10 w-[18px] shrink-0 flex items-center justify-center">
                <div className="bg-white p-[3px] rounded-full">
                  {getEffectiveStatusDot(reservation)}
                </div>
              </div>

              <div className="flex-1 min-w-0 pl-2.5">
                <div
                  className={`font-semibold text-[13px] leading-tight truncate flex items-center gap-1.5 ${
                    isElapsed ? "text-gray-400" : isCompleted ? "text-gray-700" : "text-gray-900"
                  }`}
                >
                  {reservation.guestName}
                  {reservation.isWalkIn && (
                    <span className="inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 leading-tight shrink-0">
                      Walk-in
                    </span>
                  )}
                  {isLikelySeated && !reservation.isWalkIn && (
                    <span className="inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold bg-green-50 text-green-600 border border-green-200 leading-tight shrink-0">
                      Seated
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0 rounded text-[9px] font-semibold bg-green-50 text-green-700 border border-green-200 leading-tight shrink-0">
                      <Check className="h-2.5 w-2.5" />
                      Completed
                    </span>
                  )}
                </div>
                <div
                  className={`text-[11px] mt-0.5 leading-tight ${
                    isElapsed ? "text-gray-300" : isCompleted ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {reservation.partySize} {reservation.partySize === 1 ? 'guest' : 'guests'}
                  <span className="mx-1 text-gray-300">·</span>
                  {reservation.tableIdentifier || "No table"}
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* "Now" marker at the end (all reservations are past) */}
      {isViewingToday && nowIndex === reservations.length && (
        <div className="relative flex items-center py-1.5 my-1">
          <div className="absolute left-[16px] right-[8px] h-px bg-green-400" />
          <div className="relative z-10 ml-[52px] flex items-center gap-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
            <Clock className="h-2.5 w-2.5" />
            {nowTime}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Component
// ============================================

export function GuestListPanel({ isCollapsed, venueId, externalDetailReservation, onExternalDetailConsumed, externalCreateForTableId, onExternalCreateConsumed }: GuestListPanelProps) {
  const [detailReservation, setDetailReservation] = useState<ReservationWithDetails | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationWithDetails | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Tick every 60s so time-based statuses update
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const isViewingToday = isToday(selectedDate);

  const dateStr = formatDateToISO(selectedDate);

  // --- React Query hooks ---
  const { data: reservations = [], isLoading } = useReservationsForDate(venueId, dateStr);
  const { data: reservationCounts = {} } = useReservationCounts(venueId, selectedDate);

  const createMutation = useCreateReservation(venueId, dateStr);
  const updateMutation = useUpdateReservation(venueId, dateStr);
  const updateWalkInMutation = useUpdateWalkIn(venueId, dateStr);
  const statusMutation = useUpdateReservationStatus(venueId, dateStr);
  const cancelMutation = useCancelReservation(venueId, dateStr);
  const deleteMutation = useDeleteReservation(venueId, dateStr);

  // Open detail dialog when triggered externally (e.g. from table popup)
  useEffect(() => {
    if (externalDetailReservation) {
      setDetailReservation(externalDetailReservation);
      onExternalDetailConsumed?.();
    }
  }, [externalDetailReservation, onExternalDetailConsumed]);

  // --- React Hook Form ---
  const emptyReservationForm: CreateReservationFormValues = {
    guestName: "",
    guestPhone: "",
    partySize: 1,
    reservationDate: "",
    reservationTime: "",
    tableId: null,
    specialRequests: "",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<CreateReservationFormValues>({
    resolver: zodResolver(createReservationSchema) as any,
    defaultValues: emptyReservationForm,
  });

  const watchDate = form.watch("reservationDate");
  const watchTime = form.watch("reservationTime");
  const watchPartySize = form.watch("partySize");

  // Open create dialog with pre-selected table (e.g. from table popup)
  useEffect(() => {
    if (externalCreateForTableId) {
      form.reset({ ...emptyReservationForm, tableId: externalCreateForTableId });
      setEditingReservation(null);
      setIsNewReservationOpen(true);
      onExternalCreateConsumed?.();
    }
  }, [externalCreateForTableId, onExternalCreateConsumed, form]);

  // Available tables for dropdown — exclude tables whose capacity is smaller than the party size
  const { data: tableOptions = [] } = useAvailableTables(
    venueId,
    watchDate || undefined,
    watchTime || undefined,
    undefined,
    editingReservation?.id
  );

  const filteredTableOptions = useMemo(() => {
    const size = Number(watchPartySize);
    if (!Number.isFinite(size) || size <= 1) return tableOptions;
    return tableOptions.filter((t) => t.maxCapacity >= size);
  }, [tableOptions, watchPartySize]);

  const tablesByFloor = useMemo(() => {
    const grouped: Record<string, TableOption[]> = {};
    for (const t of filteredTableOptions) {
      (grouped[t.floorName] = grouped[t.floorName] || []).push(t);
    }
    return grouped;
  }, [filteredTableOptions]);

  // --- Filtered reservations ---
  const filteredReservations = useMemo(() => {
    if (!searchQuery) return reservations;
    const q = searchQuery.toLowerCase();
    return reservations.filter(
      (r) =>
        r.guestName.toLowerCase().includes(q) ||
        r.guestPhone.includes(q) ||
        (r.tableIdentifier && r.tableIdentifier.toLowerCase().includes(q))
    );
  }, [reservations, searchQuery]);

  // --- Effective status dot (time-aware) ---
  const getEffectiveStatusDot = useCallback((reservation: ReservationWithDetails) => {
    const effective = isViewingToday
      ? getEffectiveStatus(reservation, now)
      : mapStatusToDisplay(reservation.status) as EffectiveStatus;
    const base = "w-2.5 h-2.5 rounded-full transition-all duration-200";

    switch (effective) {
      case "upcoming":
        return <div className={`${base} border-2 border-blue-500 bg-transparent`} />;
      case "likely-seated":
        return <div className={`${base} bg-green-500 ring-2 ring-green-200`} />;
      case "seated":
        return <div className={`${base} bg-green-500`} />;
      case "completed":
        return <CheckCircle2 className="w-[14px] h-[14px] text-green-500 fill-green-50" />;
      case "elapsed":
        return <div className={`${base} bg-gray-300`} />;
      case "cancelled":
        return <div className={`${base} bg-red-500`} />;
    }
  }, [isViewingToday, now]);


  // --- Handlers ---
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const openDetail = (reservation: ReservationWithDetails) => {
    setDetailReservation(reservation);
  };

  const handleOpenEditForm = (reservation: ReservationWithDetails) => {
    setDetailReservation(null);
    setEditingReservation(reservation);
    form.reset({
      // For walk-ins, seed placeholder values so the full-reservation schema
      // (which requires name + phone) doesn't block submit for hidden fields.
      // These values are ignored — walk-in edits go through updateWalkIn.
      guestName: reservation.isWalkIn ? "Walk-in" : reservation.guestName,
      guestPhone: reservation.isWalkIn ? "walk-in-placeholder" : reservation.guestPhone,
      partySize: reservation.partySize,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime.slice(0, 5),
      tableId: reservation.tableId || null,
      specialRequests: reservation.isWalkIn ? "" : (reservation.specialRequests || ""),
    });
    setIsNewReservationOpen(true);
  };

  const onSubmitReservation = async (values: CreateReservationFormValues) => {
    if (editingReservation) {
      if (editingReservation.isWalkIn) {
        const tableId = values.tableId || editingReservation.tableId;
        if (!tableId) {
          toast.error("A walk-in must be seated at a table");
          return;
        }
        const result = await updateWalkInMutation.mutateAsync({
          id: editingReservation.id,
          partySize: values.partySize,
          tableId,
          reservationDate: values.reservationDate,
          reservationTime: values.reservationTime,
        });
        if (result.success) {
          toast.success("Walk-in updated successfully");
          setIsNewReservationOpen(false);
          setEditingReservation(null);
          form.reset(emptyReservationForm);
        } else {
          toast.error(result.error || "Failed to update walk-in");
        }
        return;
      }

      const result = await updateMutation.mutateAsync({
        id: editingReservation.id,
        venueId,
        guestName: values.guestName.trim(),
        guestPhone: values.guestPhone.trim(),
        partySize: values.partySize,
        reservationDate: values.reservationDate,
        reservationTime: values.reservationTime,
        tableId: values.tableId || null,
        specialRequests: values.specialRequests?.trim() || undefined,
      });

      if (result.success) {
        toast.success("Reservation updated successfully");
        setIsNewReservationOpen(false);
        setEditingReservation(null);
        form.reset(emptyReservationForm);
      } else {
        toast.error(result.error || "Failed to update reservation");
      }
    } else {
      const result = await createMutation.mutateAsync({
        venueId,
        guestName: values.guestName.trim(),
        guestPhone: values.guestPhone.trim(),
        partySize: values.partySize,
        reservationDate: values.reservationDate,
        reservationTime: values.reservationTime,
        tableId: values.tableId || null,
        specialRequests: values.specialRequests?.trim() || undefined,
      });

      if (result.success) {
        toast.success("Reservation created successfully");
        setIsNewReservationOpen(false);
        form.reset(emptyReservationForm);
      } else {
        toast.error(result.error || "Failed to create reservation");
      }
    }
  };

  const handleMarkAsSeated = async (reservation: ReservationWithDetails) => {
    const result = await statusMutation.mutateAsync({
      id: reservation.id,
      status: "seated",
    });
    if (result.success) {
      toast.success(`${reservation.guestName} marked as seated`);
      setDetailReservation((prev) => prev?.id === reservation.id ? { ...prev, status: "seated" } : prev);
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleMarkAsCompleted = async (reservation: ReservationWithDetails) => {
    const result = await statusMutation.mutateAsync({
      id: reservation.id,
      status: "completed",
    });
    if (result.success) {
      toast.success(`${reservation.guestName} marked as completed`);
      setDetailReservation((prev) => prev?.id === reservation.id ? { ...prev, status: "completed" } : prev);
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleMarkAsNoShow = async (reservation: ReservationWithDetails) => {
    const result = await statusMutation.mutateAsync({
      id: reservation.id,
      status: "no_show",
    });
    if (result.success) {
      toast.success(`${reservation.guestName} marked as no-show`);
      setDetailReservation((prev) => prev?.id === reservation.id ? { ...prev, status: "no_show" } : prev);
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const handleCancelReservation = async (reservation: ReservationWithDetails) => {
    const previousStatus = reservation.status;
    const result = await cancelMutation.mutateAsync({
      id: reservation.id,
    });
    if (result.success) {
      setDetailReservation((prev) => prev?.id === reservation.id ? { ...prev, status: "cancelled" } : prev);
      toast(`Reservation for ${reservation.guestName} cancelled`, {
        duration: 10000,
        action: {
          label: "Undo",
          onClick: async () => {
            const undoResult = await statusMutation.mutateAsync({
              id: reservation.id,
              status: previousStatus,
            });
            if (undoResult.success) {
              toast.success("Reservation restored");
              setDetailReservation((prev) => prev?.id === reservation.id ? { ...prev, status: previousStatus } : prev);
            } else {
              toast.error("Failed to undo cancellation");
            }
          },
        },
      });
    } else {
      toast.error(result.error || "Failed to cancel reservation");
    }
  };

  const handleRestoreReservation = async (reservation: ReservationWithDetails) => {
    const result = await statusMutation.mutateAsync({
      id: reservation.id,
      status: "pending",
    });
    if (result.success) {
      toast.success(`Reservation for ${reservation.guestName} restored`);
      setDetailReservation((prev) => prev?.id === reservation.id ? { ...prev, status: "pending" } : prev);
    } else {
      toast.error(result.error || "Failed to restore reservation");
    }
  };

  const handleDeleteReservation = async (reservation: ReservationWithDetails) => {
    const result = await deleteMutation.mutateAsync(reservation.id);
    if (result.success) {
      toast.success("Reservation deleted");
      setDetailReservation(null);
    } else {
      toast.error(result.error || "Failed to delete reservation");
    }
  };

  const isMutating = statusMutation.isPending || cancelMutation.isPending || deleteMutation.isPending;

  return (
    <div className={`${isCollapsed ? 'w-0' : 'w-80'} shrink-0 bg-white border-l border-gray-200 shadow-lg overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]`}>
      {!isCollapsed && (
        <div className="h-full flex flex-col">
          {/* Header with New Reservation Button */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-gray-900">Reservations</h2>
              <Dialog
                open={isNewReservationOpen}
                onOpenChange={(open) => {
                  setIsNewReservationOpen(open);
                  if (!open) {
                    form.reset(emptyReservationForm);
                    setEditingReservation(null);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="h-8 bg-green-500 hover:bg-green-600 text-white gap-1.5 shadow-md rounded-full px-4"
                    onClick={() => {
                      setEditingReservation(null);
                      form.reset(emptyReservationForm);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Reservation
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingReservation
                      ? editingReservation.isWalkIn
                        ? "Edit Walk-In"
                        : "Edit Reservation"
                      : "New Reservation"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingReservation
                      ? editingReservation.isWalkIn
                        ? "Update the walk-in details below."
                        : "Update the reservation details below."
                      : "Create a new reservation for your guests."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmitReservation)} className="space-y-4 py-4">
                  {/* Guest Name — hidden for walk-in edits */}
                  {!editingReservation?.isWalkIn && (
                    <div className="space-y-1.5">
                      <Label htmlFor="guestName" className="text-sm">Guest Name</Label>
                      <Input
                        id="guestName"
                        placeholder="e.g., John Smith"
                        className="h-10"
                        {...form.register("guestName")}
                      />
                      {form.formState.errors.guestName && (
                        <p className="text-xs text-red-500">{form.formState.errors.guestName.message}</p>
                      )}
                    </div>
                  )}

                  {/* Phone — hidden for walk-in edits */}
                  {!editingReservation?.isWalkIn && (
                    <div className="space-y-1.5">
                      <Label htmlFor="guestPhone" className="text-sm">Phone</Label>
                      <Input
                        id="guestPhone"
                        placeholder="+1 (555) 123-4567"
                        className="h-10"
                        {...form.register("guestPhone")}
                      />
                      {form.formState.errors.guestPhone && (
                        <p className="text-xs text-red-500">{form.formState.errors.guestPhone.message}</p>
                      )}
                    </div>
                  )}

                  {/* Total Guests */}
                  <div className="space-y-1.5">
                    <Label htmlFor="partySize" className="text-sm">Total Guests</Label>
                    <Input
                      id="partySize"
                      type="number"
                      min={1}
                      placeholder="e.g., 2"
                      className="h-10"
                      {...form.register("partySize")}
                    />
                    {form.formState.errors.partySize && (
                      <p className="text-xs text-red-500">{form.formState.errors.partySize.message}</p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Date & Time</Label>
                    <DateTimePicker
                      value={
                        watchDate && watchTime
                          ? buildLocalDate(watchDate, watchTime)
                          : watchDate
                            ? buildLocalDate(watchDate)
                            : undefined
                      }
                      onChange={(date) => {
                        form.setValue("reservationDate", formatDateToISO(date), { shouldValidate: true });
                        form.setValue(
                          "reservationTime",
                          `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`,
                          { shouldValidate: true }
                        );
                      }}
                      placeholder="Pick date & time"
                    />
                    {form.formState.errors.reservationDate && (
                      <p className="text-xs text-red-500">{form.formState.errors.reservationDate.message}</p>
                    )}
                    {form.formState.errors.reservationTime && (
                      <p className="text-xs text-red-500">{form.formState.errors.reservationTime.message}</p>
                    )}
                  </div>

                  {/* Table Assignment */}
                  <div className="space-y-1.5">
                    <Label htmlFor="table" className="text-sm">Table</Label>
                    <Select
                      value={form.watch("tableId") || ""}
                      onValueChange={(val) =>
                        form.setValue("tableId", val || null)
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select a table (optional)" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {Object.entries(tablesByFloor).map(([floorName, tables]) => (
                          <SelectGroup key={floorName}>
                            <SelectLabel>{floorName}</SelectLabel>
                            {tables.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.tableIdentifier} (seats {t.maxCapacity})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {watchDate && watchTime
                        ? `Showing ${filteredTableOptions.length} available tables`
                        : "Select date & time to see available tables"}
                    </p>
                  </div>

                  {/* Notes — hidden for walk-in edits */}
                  {!editingReservation?.isWalkIn && (
                    <div className="space-y-1.5">
                      <Label htmlFor="specialRequests" className="text-sm">Notes</Label>
                      <Textarea
                        id="specialRequests"
                        placeholder="Special requests, dietary restrictions, etc."
                        className="resize-none"
                        rows={3}
                        {...form.register("specialRequests")}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={
                        editingReservation
                          ? editingReservation.isWalkIn
                            ? updateWalkInMutation.isPending
                            : updateMutation.isPending
                          : createMutation.isPending
                      }
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white gap-2"
                    >
                      {(editingReservation
                        ? editingReservation.isWalkIn
                          ? updateWalkInMutation.isPending
                          : updateMutation.isPending
                        : createMutation.isPending) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingReservation ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingReservation ? "Save Changes" : "Create Reservation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsNewReservationOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reservations..."
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
                      {format(selectedDate, "EEE, MMM d, yyyy")}
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
                          const dayStr = formatDateToISO(day.date);
                          const count = reservationCounts[dayStr];
                          const isDaySelected = modifiers.selected;
                          return (
                            <CalendarDayButton day={day} modifiers={modifiers} {...props}>
                              <span className="text-[13px] font-medium">{day.date.getDate()}</span>
                              {count ? (
                                <span className={`text-[9px] leading-none font-semibold ${isDaySelected ? 'text-white/80' : 'text-green-500'}`}>
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
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No reservations found</p>
                    </div>
                  ) : (
                    <TimelineWithNowMarker
                      reservations={filteredReservations}
                      now={now}
                      isViewingToday={isViewingToday}
                      getEffectiveStatusDot={getEffectiveStatusDot}
                      onReservationClick={openDetail}
                    />
                  )}
                </div>

              </div>

          {/* Reservation Detail Dialog */}
          <Dialog
            open={detailReservation !== null}
            onOpenChange={(open) => { if (!open) setDetailReservation(null); }}
          >
            {detailReservation && (
              <DialogContent className="sm:max-w-[420px] bg-white p-0 gap-0">
                {/* Header */}
                <div className="px-5 pt-5 pb-3">
                  <DialogHeader className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <DialogTitle className="text-lg">{detailReservation.guestName}</DialogTitle>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadgeClasses(detailReservation.status)}`}>
                        {getStatusLabel(detailReservation.status)}
                      </span>
                      {detailReservation.isWalkIn && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-amber-50 text-amber-600 border-amber-200">
                          Walk-in
                        </span>
                      )}
                    </div>
                    <DialogDescription className="text-sm text-gray-500">
                      {format(buildLocalDate(detailReservation.reservationDate), "EEEE, MMMM d")} at {formatTime24to12(detailReservation.reservationTime)}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Details */}
                <div className="px-5 pb-4 space-y-3">
                  {/* Party Size */}
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Users className="h-4 w-4 text-gray-400 shrink-0" />
                    <span>{detailReservation.partySize} {detailReservation.partySize === 1 ? 'guest' : 'guests'}</span>
                  </div>

                  {/* Phone — hidden when no phone number is saved (e.g. walk-ins) */}
                  {detailReservation.guestPhone?.trim() && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-700 min-w-0">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="truncate">{detailReservation.guestPhone}</span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-500"
                        onClick={() => handleCall(detailReservation.guestPhone)}
                      >
                        Call
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-500"
                        onClick={() => copyToClipboard(detailReservation.guestPhone, "Phone")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  )}

                  {/* Table + Floor */}
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    {detailReservation.tableIdentifier ? (
                      <span>{detailReservation.tableIdentifier} · {detailReservation.floorName || "Unknown"}</span>
                    ) : (
                      <span className="text-gray-400">No table assigned</span>
                    )}
                  </div>

                  {/* Special Requests */}
                  {detailReservation.specialRequests && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{detailReservation.specialRequests}</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
                  {detailReservation.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsSeated(detailReservation)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white gap-1.5"
                        disabled={isMutating}
                      >
                        {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Mark as Seated
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditForm(detailReservation)}
                          className="flex-1 gap-1.5"
                          disabled={isMutating}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsNoShow(detailReservation)}
                          className="flex-1 gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                          disabled={isMutating}
                        >
                          <UserX className="h-3.5 w-3.5" />
                          No Show
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelReservation(detailReservation)}
                          className="flex-1 gap-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          disabled={isMutating}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              disabled={isMutating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the reservation for {detailReservation.guestName}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep it</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReservation(detailReservation)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                  {detailReservation.status === "seated" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsCompleted(detailReservation)}
                        className="w-full bg-green-500 hover:bg-green-600 text-white gap-1.5"
                        disabled={isMutating}
                      >
                        {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Mark as Completed
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditForm(detailReservation)}
                          className="flex-1 gap-1.5"
                          disabled={isMutating}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelReservation(detailReservation)}
                          className="flex-1 gap-1.5 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          disabled={isMutating}
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              disabled={isMutating}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the reservation for {detailReservation.guestName}. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Keep it</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteReservation(detailReservation)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </>
                  )}
                  {detailReservation.status === "completed" && (
                    <div className="flex items-center gap-2">
                      <p className="flex-1 text-xs text-gray-400">This reservation has been completed.</p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            disabled={isMutating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the reservation for {detailReservation.guestName}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReservation(detailReservation)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  {detailReservation.status === "cancelled" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreReservation(detailReservation)}
                        className="flex-1 gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                        disabled={isMutating}
                      >
                        {statusMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        Restore Reservation
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            disabled={isMutating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the reservation for {detailReservation.guestName}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReservation(detailReservation)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                  {detailReservation.status === "no_show" && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1.5">
                        <p className="text-xs text-gray-400">Guest did not show up.</p>
                        <button
                          type="button"
                          onClick={() => handleRestoreReservation(detailReservation)}
                          disabled={isMutating}
                          className="text-xs text-green-600 hover:text-green-700 underline underline-offset-2 disabled:opacity-50"
                        >
                          {statusMutation.isPending ? "Undoing..." : "Undo"}
                        </button>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            disabled={isMutating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete reservation?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the reservation for {detailReservation.guestName}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteReservation(detailReservation)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </DialogContent>
            )}
          </Dialog>
        </div>
      )}
    </div>
  );
}
