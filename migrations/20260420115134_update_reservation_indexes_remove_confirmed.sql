-- Rebuild three indexes that still reference the removed 'confirmed' status.
-- New filter: 'pending' | 'seated' (the current active lifecycle).

DROP INDEX IF EXISTS public.idx_reservations_no_double_booking;
CREATE UNIQUE INDEX idx_reservations_no_double_booking
  ON public.reservations (table_id, reservation_datetime)
  WHERE status IN ('pending', 'seated') AND table_id IS NOT NULL;

DROP INDEX IF EXISTS public.idx_reservations_today;
CREATE INDEX idx_reservations_today
  ON public.reservations (venue_id, reservation_date, status)
  WHERE status IN ('pending', 'seated');

DROP INDEX IF EXISTS public.idx_reservations_active_status;
CREATE INDEX idx_reservations_active_status
  ON public.reservations (table_id, status, reservation_datetime)
  WHERE status IN ('pending', 'seated');
