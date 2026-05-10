import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database.types';

type Review = Database['public']['Tables']['reviews']['Row'];

export function useReviews(revieweeId: string | undefined) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!revieweeId) { setLoading(false); return; }
    supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', revieweeId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        setReviews(data ?? []);
        setError(error?.message ?? null);
        setLoading(false);
      });
  }, [revieweeId]);

  async function submitReview(review: Database['public']['Tables']['reviews']['Insert']) {
    const { data, error } = await supabase.from('reviews').insert(review as any).select().single();
    if (!error && data) setReviews((prev) => [data as Review, ...prev]);
    return { data, error: error?.message ?? null };
  }

  return { reviews, loading, error, submitReview };
}
