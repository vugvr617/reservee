-- 1. Drop the duplicate trigger and its function
DROP TRIGGER IF EXISTS reservations_update_guest_stats ON public.reservations;
DROP FUNCTION IF EXISTS public.update_guest_stats();

-- 2. Backfill guest stats from actual reservation data (truth source)
UPDATE guests g
SET 
  total_reservations = sub.total,
  total_cancellations = sub.cancelled,
  total_no_shows = sub.no_shows,
  last_visit_date = sub.last_completed
FROM (
  SELECT 
    guest_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
    COUNT(*) FILTER (WHERE status = 'no_show') AS no_shows,
    MAX(reservation_date) FILTER (WHERE status = 'completed') AS last_completed
  FROM reservations
  WHERE guest_id IS NOT NULL
  GROUP BY guest_id
) AS sub
WHERE g.id = sub.guest_id;

-- 3. For guests with no reservations at all, zero the counters
UPDATE guests
SET total_reservations = 0, total_cancellations = 0, total_no_shows = 0, last_visit_date = NULL
WHERE id NOT IN (SELECT DISTINCT guest_id FROM reservations WHERE guest_id IS NOT NULL);
