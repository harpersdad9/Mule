import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

interface UltraSignupEvent {
  EventID: number;
  EventName: string;
  City: string;
  State: string;
  StartDate: string;
  FinishCutoffTime?: string;
  Website?: string;
  Distances?: string;
}

function normalizeRace(event: UltraSignupEvent) {
  const distances = event.Distances
    ? event.Distances.split(',').map((d: string) => d.trim()).filter(Boolean)
    : [];
  return {
    ultrasignup_race_id: event.EventID,
    name: event.EventName,
    location_city: event.City ?? null,
    location_state: event.State ?? null,
    race_date: event.StartDate ? event.StartDate.split('T')[0] : null,
    distances_json: distances.length > 0 ? distances : null,
    ultrasignup_url: `https://ultrasignup.com/register.aspx?did=${event.EventID}`,
    website_url: event.Website ?? null,
    last_fetched_at: new Date().toISOString(),
  };
}

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { query } = await req.json();
  if (!query?.trim()) return new Response(JSON.stringify({ races: [] }), { headers: { 'Content-Type': 'application/json' } });

  try {
    const url = `https://ultrasignup.com/service/events.svc/json/search?q=${encodeURIComponent(query)}&count=20`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mule App (mule.run) - Ultra Running Pacer Marketplace',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`UltraSignup returned ${res.status}`);

    const events: UltraSignupEvent[] = await res.json();
    const normalized = events
      .filter((e) => e.StartDate && new Date(e.StartDate) >= new Date())
      .map(normalizeRace)
      .filter((r) => r.race_date);

    if (normalized.length > 0) {
      await supabaseAdmin.from('races').upsert(normalized, { onConflict: 'ultrasignup_race_id' });
    }

    // Return from DB to include our IDs
    const raceIds = normalized.map((r) => r.ultrasignup_race_id);
    const { data: races } = await supabaseAdmin
      .from('races')
      .select('id, ultrasignup_race_id, name, location_city, location_state, race_date, distances_json')
      .in('ultrasignup_race_id', raceIds)
      .order('race_date', { ascending: true });

    return new Response(JSON.stringify({ races: races ?? [] }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    // Fallback to cached results
    const { data: cached } = await supabaseAdmin
      .from('races')
      .select('id, ultrasignup_race_id, name, location_city, location_state, race_date, distances_json')
      .ilike('name', `%${query}%`)
      .gte('race_date', new Date().toISOString().split('T')[0])
      .order('race_date', { ascending: true })
      .limit(20);

    return new Response(JSON.stringify({ races: cached ?? [], cached: true }), { headers: { 'Content-Type': 'application/json' } });
  }
});
