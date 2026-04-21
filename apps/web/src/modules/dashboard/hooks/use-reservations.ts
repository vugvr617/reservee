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
  createWalkIn,
  updateWalkIn,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
  deleteReservation,
} from "../reservation-actions";
import type {
  ReservationWithDetails,
  ReservationStatus,
  CreateReservationInput,
  UpdateReservationInput,
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
  partySize?: number,
  excludeReservationId?: string
) {
  return useQuery({
    queryKey: ["available-tables", venueId, date, time, partySize, excludeReservationId],
    queryFn: async () => {
      const result =
        date && time
          ? await getAvailableTablesForSlot(venueId, date, time, 90, partySize, excludeReservationId)
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
        status: "pending",
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
        isWalkIn: false,
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

interface CreateWalkInVars {
  tableId: string;
  partySize: number;
  reservationDate?: string;
  reservationTime?: string;
}

export function useCreateWalkIn(venueId: string) {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  return useMutation({
    mutationFn: (vars: CreateWalkInVars) =>
      createWalkIn({
        venueId,
        tableId: vars.tableId,
        partySize: vars.partySize,
        reservationDate: vars.reservationDate,
        reservationTime: vars.reservationTime,
      }),
    onMutate: async (vars) => {
      const date = vars.reservationDate || today;
      await queryClient.cancelQueries({
        queryKey: ["reservations", venueId, date],
      });

      const previousReservations = queryClient.getQueryData<ReservationWithDetails[]>([
        "reservations",
        venueId,
        date,
      ]);

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const time = vars.reservationTime || `${pad(now.getHours())}:${pad(now.getMinutes())}`;

      const optimisticWalkIn: ReservationWithDetails = {
        id: `temp-walkin-${Date.now()}`,
        guestName: "Walk-in",
        guestPhone: "",
        guestId: null,
        partySize: vars.partySize,
        reservationDate: date,
        reservationTime: time,
        reservationDatetime: `${date}T${time}:00`,
        durationMinutes: 90,
        status: "seated",
        specialRequests: null,
        internalNotes: null,
        tableId: vars.tableId,
        floorId: null,
        tableIdentifier: null,
        floorName: null,
        tableMaxCapacity: null,
        createdAt: now.toISOString(),
        seatedAt: now.toISOString(),
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
        isWalkIn: true,
      };

      queryClient.setQueryData<ReservationWithDetails[]>(
        ["reservations", venueId, date],
        (old) =>
          [...(old || []), optimisticWalkIn].sort((a, b) =>
            a.reservationTime.localeCompare(b.reservationTime)
          )
      );

      return { previousReservations, date };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReservations && context?.date) {
        queryClient.setQueryData(
          ["reservations", venueId, context.date],
          context.previousReservations
        );
      }
    },
    onSettled: (_data, _error, vars) => {
      const date = vars.reservationDate || today;
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, date],
      });
      queryClient.invalidateQueries({
        queryKey: ["reservation-counts", venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["table-reservations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-tables", venueId],
      });
    },
  });
}

interface UpdateWalkInVars {
  id: string;
  partySize: number;
  tableId: string;
  reservationDate: string;
  reservationTime: string;
}

export function useUpdateWalkIn(venueId: string, currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: UpdateWalkInVars) => updateWalkIn(vars),
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, currentDate],
      });
      if (vars.reservationDate !== currentDate) {
        queryClient.invalidateQueries({
          queryKey: ["reservations", venueId, vars.reservationDate],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["available-tables", venueId] });
      queryClient.invalidateQueries({ queryKey: ["table-reservations"] });
    },
  });
}

export function useUpdateReservation(venueId: string, currentDate: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateReservationInput) => updateReservation(input),
    onMutate: async (input) => {
      // Cancel queries for both old date (currentDate) and new date
      await queryClient.cancelQueries({
        queryKey: ["reservations", venueId, currentDate],
      });
      if (input.reservationDate !== currentDate) {
        await queryClient.cancelQueries({
          queryKey: ["reservations", venueId, input.reservationDate],
        });
      }

      const previousReservations = queryClient.getQueryData<ReservationWithDetails[]>([
        "reservations",
        venueId,
        currentDate,
      ]);

      // Optimistically update the reservation in the cache
      queryClient.setQueryData<ReservationWithDetails[]>(
        ["reservations", venueId, currentDate],
        (old) =>
          (old || []).map((r) =>
            r.id === input.id
              ? {
                  ...r,
                  guestName: input.guestName,
                  guestPhone: input.guestPhone,
                  partySize: input.partySize,
                  reservationDate: input.reservationDate,
                  reservationTime: input.reservationTime,
                  reservationDatetime: `${input.reservationDate}T${input.reservationTime}:00`,
                  tableId: input.tableId || null,
                  specialRequests: input.specialRequests || null,
                }
              : r
          )
      );

      return { previousReservations };
    },
    onError: (_err, _input, context) => {
      if (context?.previousReservations) {
        queryClient.setQueryData(
          ["reservations", venueId, currentDate],
          context.previousReservations
        );
      }
    },
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: ["reservations", venueId, currentDate],
      });
      // If date changed, also invalidate the new date
      if (input.reservationDate !== currentDate) {
        queryClient.invalidateQueries({
          queryKey: ["reservations", venueId, input.reservationDate],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ["reservation-counts", venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["available-tables", venueId],
      });
      queryClient.invalidateQueries({
        queryKey: ["table-reservations"],
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
