-- ============================================================
-- 0002 - Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- ---- profiles ----
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ---- profile_photos ----
CREATE POLICY "profile_photos_select_authenticated" ON public.profile_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profile_photos_insert_own" ON public.profile_photos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profile_photos_delete_own" ON public.profile_photos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- strava_connections ----
CREATE POLICY "strava_select_own" ON public.strava_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "strava_insert_own" ON public.strava_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "strava_update_own" ON public.strava_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ---- races ----
CREATE POLICY "races_select_authenticated" ON public.races
  FOR SELECT TO authenticated USING (true);

-- Upserts handled by service role in Edge Functions (no client insert policy)

-- ---- listings ----
CREATE POLICY "listings_select_authenticated" ON public.listings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "listings_insert_own" ON public.listings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "listings_update_own" ON public.listings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "listings_delete_own" ON public.listings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---- bookings ----
CREATE POLICY "bookings_select_participants" ON public.bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = runner_id OR auth.uid() = provider_id
  );

CREATE POLICY "bookings_insert_runner" ON public.bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = runner_id);

-- Status transitions enforced in Edge Functions; allow participants to update
CREATE POLICY "bookings_update_participants" ON public.bookings
  FOR UPDATE TO authenticated USING (
    auth.uid() = runner_id OR auth.uid() = provider_id
  );

-- ---- messages ----
CREATE POLICY "messages_select_participants" ON public.messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.runner_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_participants" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.runner_id = auth.uid() OR b.provider_id = auth.uid())
        AND b.status NOT IN ('cancelled', 'disputed')
    )
  );

-- ---- reviews ----
CREATE POLICY "reviews_select_authenticated" ON public.reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert_reviewer" ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
        AND (b.runner_id = auth.uid() OR b.provider_id = auth.uid())
        AND b.status IN ('completed', 'reviewed')
    )
  );

-- ---- stripe_accounts ----
CREATE POLICY "stripe_select_own" ON public.stripe_accounts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Writes handled only by service role (Edge Functions)

-- ---- notifications ----
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ---- push_tokens ----
CREATE POLICY "push_tokens_select_own" ON public.push_tokens
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "push_tokens_insert_own" ON public.push_tokens
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "push_tokens_delete_own" ON public.push_tokens
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
