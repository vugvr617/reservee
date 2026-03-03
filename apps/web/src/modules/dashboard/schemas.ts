import { z } from "zod";

export const createReservationSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestPhone: z.string().min(7, "Valid phone number is required"),
  partySize: z.coerce.number()
    .min(1, "At least 1 guest")
    .max(50, "Max 50 guests"),
  reservationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date required"),
  reservationTime: z.string().regex(/^\d{2}:\d{2}$/, "Valid time required"),
  tableId: z.string().nullable().optional(),
  specialRequests: z.string().optional(),
});

export type CreateReservationFormValues = z.infer<typeof createReservationSchema>;
