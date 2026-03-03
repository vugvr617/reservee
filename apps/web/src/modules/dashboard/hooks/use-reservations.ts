import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  getReservationsForDate,
  getReservationCountsByDateRange,
  getAvailableTablesForSlot,
  getAllTablesGroupedByFloor,
  getUpcomingReservationsForTable,
  createReservation,
  updateReservationStatus,
  cancelReservation,
  deleteReservation,
} from "../reservation-actions";
import type {
  ReservationWithDetails,
  ReservationStatus,
  CreateReservationInput,
} from "../types";

// ============================================
// Queries
// ============================================

export function useReservationsForDate(venueId: string, date: string) {
  return useQuery({
    queryKey: ["reservations", venueId, date],
    queryFn: async () => {
      const result = await getReservationsForDate(venueId, date);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    placeholderData: keepPreviousData,
    enabled: !!venueId && !!date,
  });
}

export function useReservationCounts(venueId: string, calendarMonth: Date) {
  const monthStart = format(startOfMonth(calendarMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(calendarMonth), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["reservation-counts", venueId, monthStart, monthEnd],
    queryFn: async () => {
      const result = await getReservationCountsByDateRange(venueId, monthStart, monthEnd);
      if (!result.success) throw new Error(result.error);
      return result.data || {};
    },
    enabled: !!venueId,
  });
}

export function useUpcomingTableReservations(tableId: string | null) {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["table-reservations", tableId],
    queryFn: async () => {
      const result = await getUpcomingReservationsForTable(tableId!, today);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!tableId,
    placeholderData: keepPreviousData,
  });
}

export function useAvailableTables(
  venueId: string,
  date?: string,
  time?: string,
  partySize?: number
) {
  return useQuery({
    queryKey: ["available-tables", venueId, date, time, partySize],
    queryFn: async () => {
      const result =
        date && time
          ? await getAvailableTablesForSlot(venueId, date, time, 90, partySize)
          : await getAllTablesGroupedByFloor(venueId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: !!venueId,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateReservation(venueId: string, currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReservationInput) => createReservation(input),
    onMutate: async (input) => {
      // Cancel in-flight queries for this date
      await queryClient.cancelQueries({
        queryKey: ["reservations", venueId, input.reservationDate],
      });

      // Snapshot previous data for rollback
      const previousReservations = queryClient.getQueryData<ReservationWithDetails[]>([
        "reservations",
        venueId,
        input.reservationDate,
      ]);

      // Optimistically add the reservation
      const optimisticReservation: ReservationWithDetails = {
        id: `temp-${Date.now()}`,
        guestName: input.guestName,
        guestPhone: input.guestPhone,
        guestId: "",
        partySize: input.partySize,
        reservationDate: input.reservationDate,
        reservationTime: input.reservationTime,
        reservationDatetime: `${input.reservationDate}T${input.reservationTime}:00`,
        durationMinutes: input.durationMinutes || 90,
        status: "confirmed",
        specialRequests: input.specialRequests || null,
        internalNotes: null,
        tableId: input.tableId || null,
        floorId: input.floorId || null,
        tableIdentifier: null,
        floorName: null,
        tableMaxCapacity: null,
        createdAt: new Date().toISOString(),
        seatedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
      };

      queryClient.setQueryData<ReservationWithDetails[]>(
        ["reservations", venueId, input.reservationDate],
        (old) => {
          const list = old || [];
          return [...list, optimisticReservation].sort((a, b) =>
            a.reservationTime.localeCompare(b.reservationTime)
          );
        }
      );

      return { previousReservations };
    },
    onError: (_err, input, context) => {
      // Rollback on failure
      if (context?.previousReservations) {
        queryClient.setQueryData(
          ["reservations", venueId, input.reservationDate],
          context.previousReservations
        );
      }
    },
    onSettled: (_data, _error, input) => {
      // Refetch to get real data from server
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, input.reservationDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["reservation-counts", venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-tables", venueId],
      });
    },
  });
}

export function useUpdateReservationStatus(venueId: string, currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: ReservationStatus;
      reason?: string;
    }) => updateReservationStatus(id, status, reason),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({
        queryKey: ["reservations", venueId, currentDate],
      });

      const previousReservations = queryClient.getQueryData<ReservationWithDetails[]>([
        "reservations",
        venueId,
        currentDate,
      ]);

      // Optimistically update status
      queryClient.setQueryData<ReservationWithDetails[]>(
        ["reservations", venueId, currentDate],
        (old) =>
          (old || []).map((r) =>
            r.id === id ? { ...r, status } : r
          )
      );

      return { previousReservations };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(
          ["reservations", venueId, currentDate],
          context.previousReservations
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, currentDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["reservation-counts", venueId],
      });
    },
  });
}

export function useCancelReservation(venueId: string, currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      cancelReservation(id, reason),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: ["reservations", venueId, currentDate],
      });

      const previousReservations = queryClient.getQueryData<ReservationWithDetails[]>([
        "reservations",
        venueId,
        currentDate,
      ]);

      queryClient.setQueryData<ReservationWithDetails[]>(
        ["reservations", venueId, currentDate],
        (old) =>
          (old || []).map((r) =>
            r.id === id ? { ...r, status: "cancelled" as ReservationStatus } : r
          )
      );

      return { previousReservations };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(
          ["reservations", venueId, currentDate],
          context.previousReservations
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, currentDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["reservation-counts", venueId],
      });
    },
  });
}

export function useDeleteReservation(venueId: string, currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteReservation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["reservations", venueId, currentDate],
      });

      const previousReservations = queryClient.getQueryData<ReservationWithDetails[]>([
        "reservations",
        venueId,
        currentDate,
      ]);

      // Optimistically remove from list
      queryClient.setQueryData<ReservationWithDetails[]>(
        ["reservations", venueId, currentDate],
        (old) => (old || []).filter((r) => r.id !== id)
      );

      return { previousReservations };
    },
    onError: (_err, _id, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(
          ["reservations", venueId, currentDate],
          context.previousReservations
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, currentDate],
      });
      queryClient.invalidateQueries({
        queryKey: ["reservation-counts", venueId],
      });
    },
  });
}
