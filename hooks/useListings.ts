import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Listing = Database['public']['Tables']['listings']['Row'];

export function useMyListings(userId: string | undefined) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load(userId);
  }, [userId]);

  async function load(uid: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    setListings(data ?? []);
    setError(error?.message ?? null);
    setLoading(false);
  }

  async function createListing(listing: Database['public']['Tables']['listings']['Insert']) {
    const { data, error } = await supabase.from('listings').insert(listing as any).select().single();
    if (!error && data) setListings((prev) => [data as Listing, ...prev]);
    return { data, error: error?.message ?? null };
  }

  async function updateListing(id: string, updates: Database['public']['Tables']['listings']['Update']) {
    // @ts-expect-error supabase-js v2 Database generic incompatibility with hand-written types
    const { error } = await supabase.from('listings').update(updates).eq('id', id);
    if (!error) setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    return { error: error?.message ?? null };
  }

  return { listings, loading, error, createListing, updateListing, reload: () => userId && load(userId) };
}

export function useRaceListings(raceId: string | undefined, roleType?: 'pacer' | 'crew') {
  const [listings, setListings] = useState<(Listing & { profile: { full_name: string; avatar_url: string | null; username: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!raceId) { setLoading(false); return; }

    let query = supabase
      .from('listings')
      .select('*, profile:profiles(full_name, avatar_url, username)')
      .eq('race_id', raceId)
      .eq('status', 'active');

    if (roleType) query = query.eq('role_type', roleType);

    query.order('created_at', { ascending: false }).then(({ data, error }) => {
      setListings((data as typeof listings) ?? []);
      setError(error?.message ?? null);
      setLoading(false);
    });
  }, [raceId, roleType]);

  return { listings, loading, error };
}
