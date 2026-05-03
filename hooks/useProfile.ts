import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type StravaConnection = Database['public']['Tables']['strava_connections']['Row'];

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [strava, setStrava] = useState<StravaConnection | null>(null);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    load(userId);
  }, [userId]);

  async function load(uid: string) {
    setLoading(true);
    setError(null);

    const [profileRes, stravaRes, ratingRes, reviewRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('strava_connections').select('*').eq('user_id', uid).single(),
      supabase.rpc('get_average_rating', { user_id: uid } as any),
      supabase.from('reviews').select('id', { count: 'exact' }).eq('reviewee_id', uid),
    ]);

    if (profileRes.error) setError(profileRes.error.message);
    setProfile(profileRes.data ?? null);
    setStrava(stravaRes.data ?? null);
    setAvgRating(ratingRes.data ?? null);
    setReviewCount(reviewRes.count ?? 0);
    setLoading(false);
  }

  async function updateProfile(updates: Database['public']['Tables']['profiles']['Update']) {
    if (!userId) return { error: 'Not authenticated' };
    // @ts-expect-error supabase-js v2 Database generic incompatibility with hand-written types
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (!error) await load(userId);
    return { error: error?.message ?? null };
  }

  return { profile, strava, avgRating, reviewCount, loading, error, updateProfile, reload: () => userId && load(userId) };
}
