import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];

export function useBookings(userId: string | undefined) {
  const [sentBookings, setSentBookings] = useState<Booking[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    load(userId);
  }, [userId]);

  async function load(uid: string) {
    setLoading(true);
    const [sent, received] = await Promise.all([
      supabase.from('bookings').select('*').eq('runner_id', uid).order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').eq('provider_id', uid).order('created_at', { ascending: false }),
    ]);
    setSentBookings(sent.data ?? []);
    setReceivedBookings(received.data ?? []);
    setError(sent.error?.message ?? received.error?.message ?? null);
    setLoading(false);
  }

  async function createBooking(booking: Database['public']['Tables']['bookings']['Insert']) {
    const { data, error } = await supabase.from('bookings').insert(booking as any).select().single();
    if (!error && data) setSentBookings((prev) => [data as Booking, ...prev]);
    return { data, error: error?.message ?? null };
  }

  async function updateBookingStatus(id: string, status: Booking['status'], extra?: Partial<Booking>) {
    // @ts-expect-error supabase-js v2 Database generic incompatibility with hand-written types
    const { error } = await supabase.from('bookings').update({ status, ...extra }).eq('id', id);
    if (!error) {
      const update = (prev: Booking[]) => prev.map((b) => (b.id === id ? { ...b, status, ...extra } : b));
      setSentBookings(update);
      setReceivedBookings(update);
    }
    return { error: error?.message ?? null };
  }

  return { sentBookings, receivedBookings, loading, error, createBooking, updateBookingStatus, reload: () => userId && load(userId) };
}

export function useBookingDetail(bookingId: string | undefined) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) { setLoading(false); return; }
    supabase.from('bookings').select('*').eq('id', bookingId).single().then(({ data, error }) => {
      setBooking(data ?? null);
      setError(error?.message ?? null);
      setLoading(false);
    });
  }, [bookingId]);

  return { booking, loading, error };
}
