-- ============================================================
-- 0003 - Database Functions
-- ============================================================

-- Average rating for a user as reviewee
CREATE OR REPLACE FUNCTION public.get_average_rating(user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ROUND(AVG(rating)::numeric, 1)
  FROM public.reviews
  WHERE reviewee_id = user_id;
$$;

-- Move paid bookings to completed after race date passes
-- Called by a scheduled Edge Function (cron) daily
CREATE OR REPLACE FUNCTION public.complete_past_race_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.bookings b
  SET status = 'completed', updated_at = now()
  FROM public.listings l
  JOIN public.races r ON r.id = l.race_id
  WHERE b.listing_id = l.id
    AND b.status = 'paid'
    AND r.race_date < CURRENT_DATE - INTERVAL '1 day'
  ;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
