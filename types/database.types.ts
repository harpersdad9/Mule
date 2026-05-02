// Auto-generated types from Supabase schema.
// Run `supabase gen types typescript --local > types/database.types.ts` to regenerate.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          location_state: string | null;
          is_runner: boolean;
          is_pacer: boolean;
          is_crew: boolean;
          onboarding_done: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          location_state?: string | null;
          is_runner?: boolean;
          is_pacer?: boolean;
          is_crew?: boolean;
          onboarding_done?: boolean;
        };
        Update: {
          username?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          location_state?: string | null;
          is_runner?: boolean;
          is_pacer?: boolean;
          is_crew?: boolean;
          onboarding_done?: boolean;
        };
      };
      strava_connections: {
        Row: {
          id: string;
          user_id: string;
          strava_athlete_id: number;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          total_distance_km: number | null;
          total_elevation_m: number | null;
          ytd_distance_km: number | null;
          longest_run_km: number | null;
          race_count: number | null;
          raw_stats_json: Json | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          strava_athlete_id: number;
          access_token: string;
          refresh_token: string;
          token_expires_at: string;
          total_distance_km?: number | null;
          total_elevation_m?: number | null;
          ytd_distance_km?: number | null;
          longest_run_km?: number | null;
          race_count?: number | null;
          raw_stats_json?: Json | null;
          last_synced_at?: string | null;
        };
        Update: {
          access_token?: string;
          refresh_token?: string;
          token_expires_at?: string;
          total_distance_km?: number | null;
          total_elevation_m?: number | null;
          ytd_distance_km?: number | null;
          longest_run_km?: number | null;
          race_count?: number | null;
          raw_stats_json?: Json | null;
          last_synced_at?: string | null;
        };
      };
      profile_photos: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          is_primary: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          storage_path: string;
          is_primary?: boolean;
          sort_order?: number;
        };
        Update: {
          storage_path?: string;
          is_primary?: boolean;
          sort_order?: number;
        };
      };
      races: {
        Row: {
          id: string;
          ultrasignup_race_id: number;
          name: string;
          location_city: string | null;
          location_state: string | null;
          race_date: string;
          distances_json: Json | null;
          aid_stations_json: Json | null;
          website_url: string | null;
          ultrasignup_url: string | null;
          last_fetched_at: string;
          created_at: string;
        };
        Insert: {
          ultrasignup_race_id: number;
          name: string;
          location_city?: string | null;
          location_state?: string | null;
          race_date: string;
          distances_json?: Json | null;
          aid_stations_json?: Json | null;
          website_url?: string | null;
          ultrasignup_url?: string | null;
          last_fetched_at?: string;
        };
        Update: {
          name?: string;
          location_city?: string | null;
          location_state?: string | null;
          race_date?: string;
          distances_json?: Json | null;
          aid_stations_json?: Json | null;
          website_url?: string | null;
          ultrasignup_url?: string | null;
          last_fetched_at?: string;
        };
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          race_id: string;
          role_type: 'pacer' | 'crew';
          title: string;
          description: string | null;
          segment_start: string | null;
          segment_end: string | null;
          segment_miles: number | null;
          rate_type: 'hourly' | 'flat';
          rate_amount: number;
          status: 'active' | 'paused' | 'filled' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          race_id: string;
          role_type: 'pacer' | 'crew';
          title: string;
          description?: string | null;
          segment_start?: string | null;
          segment_end?: string | null;
          segment_miles?: number | null;
          rate_type: 'hourly' | 'flat';
          rate_amount: number;
          status?: 'active' | 'paused' | 'filled' | 'cancelled';
        };
        Update: {
          race_id?: string;
          role_type?: 'pacer' | 'crew';
          title?: string;
          description?: string | null;
          segment_start?: string | null;
          segment_end?: string | null;
          segment_miles?: number | null;
          rate_type?: 'hourly' | 'flat';
          rate_amount?: number;
          status?: 'active' | 'paused' | 'filled' | 'cancelled';
        };
      };
      bookings: {
        Row: {
          id: string;
          listing_id: string;
          runner_id: string;
          provider_id: string;
          agreed_rate_type: 'hourly' | 'flat';
          agreed_rate_amount: number;
          agreed_role_type: 'pacer' | 'crew';
          stripe_payment_intent_id: string | null;
          stripe_transfer_id: string | null;
          platform_fee_cents: number | null;
          total_amount_cents: number | null;
          status: 'pending' | 'accepted' | 'paid' | 'completed' | 'reviewed' | 'cancelled' | 'disputed';
          runner_reviewed_at: string | null;
          provider_reviewed_at: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          listing_id: string;
          runner_id: string;
          provider_id: string;
          agreed_rate_type: 'hourly' | 'flat';
          agreed_rate_amount: number;
          agreed_role_type: 'pacer' | 'crew';
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          platform_fee_cents?: number | null;
          total_amount_cents?: number | null;
          status?: 'pending' | 'accepted' | 'paid' | 'completed' | 'reviewed' | 'cancelled' | 'disputed';
          runner_reviewed_at?: string | null;
          provider_reviewed_at?: string | null;
          cancellation_reason?: string | null;
        };
        Update: {
          stripe_payment_intent_id?: string | null;
          stripe_transfer_id?: string | null;
          platform_fee_cents?: number | null;
          total_amount_cents?: number | null;
          status?: 'pending' | 'accepted' | 'paid' | 'completed' | 'reviewed' | 'cancelled' | 'disputed';
          runner_reviewed_at?: string | null;
          provider_reviewed_at?: string | null;
          cancellation_reason?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          booking_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          booking_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment: string | null;
          photos_json: Json | null;
          created_at: string;
        };
        Insert: {
          booking_id: string;
          reviewer_id: string;
          reviewee_id: string;
          rating: number;
          comment?: string | null;
          photos_json?: Json | null;
        };
        Update: {
          rating?: number;
          comment?: string | null;
          photos_json?: Json | null;
        };
      };
      stripe_accounts: {
        Row: {
          id: string;
          user_id: string;
          stripe_account_id: string;
          charges_enabled: boolean;
          payouts_enabled: boolean;
          details_submitted: boolean;
          onboarding_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stripe_account_id: string;
          charges_enabled?: boolean;
          payouts_enabled?: boolean;
          details_submitted?: boolean;
          onboarding_url?: string | null;
        };
        Update: {
          charges_enabled?: boolean;
          payouts_enabled?: boolean;
          details_submitted?: boolean;
          onboarding_url?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string | null;
          data_json: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: string;
          title: string;
          body?: string | null;
          data_json?: Json | null;
          read_at?: string | null;
        };
        Update: {
          read_at?: string | null;
        };
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
          created_at: string;
        };
        Insert: {
          user_id: string;
          token: string;
          platform: 'ios' | 'android';
        };
        Update: {
          token?: string;
          platform?: 'ios' | 'android';
        };
      };
    };
    Functions: {
      get_average_rating: {
        Args: { user_id: string };
        Returns: number | null;
      };
    };
  };
}
