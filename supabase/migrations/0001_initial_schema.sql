-- ============================================================
-- 0001 - Initial Schema
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         text UNIQUE NOT NULL,
  full_name        text NOT NULL,
  avatar_url       text,
  bio              text,
  location_state   text,
  is_runner        boolean NOT NULL DEFAULT false,
  is_pacer         boolean NOT NULL DEFAULT false,
  is_crew          boolean NOT NULL DEFAULT false,
  onboarding_done  boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Profile photos
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  is_primary    boolean NOT NULL DEFAULT false,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Strava OAuth connections
CREATE TABLE IF NOT EXISTS public.strava_connections (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  strava_athlete_id   bigint NOT NULL,
  access_token        text NOT NULL,
  refresh_token       text NOT NULL,
  token_expires_at    timestamptz NOT NULL,
  total_distance_km   numeric,
  total_elevation_m   numeric,
  ytd_distance_km     numeric,
  longest_run_km      numeric,
  race_count          integer,
  raw_stats_json      jsonb,
  last_synced_at      timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Races (cached from UltraSignup)
CREATE TABLE IF NOT EXISTS public.races (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ultrasignup_race_id   integer UNIQUE NOT NULL,
  name                  text NOT NULL,
  location_city         text,
  location_state        text,
  race_date             date NOT NULL,
  distances_json        jsonb,
  aid_stations_json     jsonb,
  website_url           text,
  ultrasignup_url       text,
  last_fetched_at       timestamptz NOT NULL DEFAULT now(),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_races_race_date ON public.races (race_date);
CREATE INDEX IF NOT EXISTS idx_races_name ON public.races USING gin (to_tsvector('english', name));

-- Listings (pacer/crew availability for a race)
CREATE TABLE IF NOT EXISTS public.listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  race_id         uuid NOT NULL REFERENCES public.races(id),
  role_type       text NOT NULL CHECK (role_type IN ('pacer', 'crew')),
  title           text NOT NULL,
  description     text,
  segment_start   text,
  segment_end     text,
  segment_miles   numeric,
  rate_type       text NOT NULL CHECK (rate_type IN ('hourly', 'flat')),
  rate_amount     numeric NOT NULL CHECK (rate_amount > 0),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'filled', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listings_race_role_status ON public.listings (race_id, role_type, status);
CREATE INDEX IF NOT EXISTS idx_listings_user ON public.listings (user_id);

-- Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id                uuid NOT NULL REFERENCES public.listings(id),
  runner_id                 uuid NOT NULL REFERENCES public.profiles(id),
  provider_id               uuid NOT NULL REFERENCES public.profiles(id),
  agreed_rate_type          text NOT NULL CHECK (agreed_rate_type IN ('hourly', 'flat')),
  agreed_rate_amount        numeric NOT NULL,
  agreed_role_type          text NOT NULL CHECK (agreed_role_type IN ('pacer', 'crew')),
  stripe_payment_intent_id  text,
  stripe_transfer_id        text,
  platform_fee_cents        integer,
  total_amount_cents        integer,
  status                    text NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'accepted', 'paid', 'completed', 'reviewed', 'cancelled', 'disputed')),
  runner_reviewed_at        timestamptz,
  provider_reviewed_at      timestamptz,
  cancellation_reason       text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bookings_runner ON public.bookings (runner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON public.bookings (provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON public.bookings (listing_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings (status);

-- Messages (per-booking chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id   uuid NOT NULL REFERENCES public.profiles(id),
  body        text NOT NULL,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_booking ON public.messages (booking_id, created_at);

-- Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reviewer_id   uuid NOT NULL REFERENCES public.profiles(id),
  reviewee_id   uuid NOT NULL REFERENCES public.profiles(id),
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  photos_json   jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON public.reviews (reviewee_id);

-- Stripe Connect accounts
CREATE TABLE IF NOT EXISTS public.stripe_accounts (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_account_id     text UNIQUE NOT NULL,
  charges_enabled       boolean NOT NULL DEFAULT false,
  payouts_enabled       boolean NOT NULL DEFAULT false,
  details_submitted     boolean NOT NULL DEFAULT false,
  onboarding_url        text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL,
  body        text,
  data_json   jsonb,
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, created_at DESC);

-- Push notification tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token       text NOT NULL,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);
