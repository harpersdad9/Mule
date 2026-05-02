import { supabase } from './supabase';
import type { RaceOption } from '../types/app.types';

export async function searchRaces(query: string): Promise<{ races: RaceOption[]; error: string | null }> {
  if (!query.trim()) return { races: [], error: null };

  const { data, error } = await supabase.functions.invoke('ultrasignup-search', {
    body: { query: query.trim() },
  });

  if (error) {
    // Fall back to cached results on function error
    const { data: cached, error: dbError } = await supabase
      .from('races')
      .select('id, ultrasignup_race_id, name, location_city, location_state, race_date, distances_json')
      .ilike('name', `%${query}%`)
      .gte('race_date', new Date().toISOString().split('T')[0])
      .order('race_date', { ascending: true })
      .limit(20);

    if (dbError) return { races: [], error: dbError.message };
    return { races: (cached ?? []) as RaceOption[], error: null };
  }

  return { races: (data?.races ?? []) as RaceOption[], error: null };
}

export async function getRaceById(raceId: string): Promise<{ race: RaceOption | null; error: string | null }> {
  const { data, error } = await supabase
    .from('races')
    .select('id, ultrasignup_race_id, name, location_city, location_state, race_date, distances_json')
    .eq('id', raceId)
    .single();

  if (error) return { race: null, error: error.message };
  return { race: data as RaceOption, error: null };
}
