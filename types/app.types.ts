export type UserRole = 'runner' | 'pacer' | 'crew';
export type RoleType = 'pacer' | 'crew';
export type RateType = 'hourly' | 'flat';
export type ListingStatus = 'active' | 'paused' | 'filled' | 'cancelled';
export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'paid'
  | 'completed'
  | 'reviewed'
  | 'cancelled'
  | 'disputed';

export interface StravaStats {
  total_distance_km: number | null;
  total_elevation_m: number | null;
  ytd_distance_km: number | null;
  longest_run_km: number | null;
  race_count: number | null;
  last_synced_at: string | null;
}

export interface RaceOption {
  id: string;
  ultrasignup_race_id: number;
  name: string;
  location_city: string | null;
  location_state: string | null;
  race_date: string;
  distances_json: string[] | null;
}

export interface ProfileSummary {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  is_runner: boolean;
  is_pacer: boolean;
  is_crew: boolean;
  avg_rating?: number | null;
  review_count?: number;
}

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  agreed_role_type: RoleType;
  agreed_rate_type: RateType;
  agreed_rate_amount: number;
  total_amount_cents: number | null;
  race: RaceOption;
  runner: ProfileSummary;
  provider: ProfileSummary;
  created_at: string;
}
