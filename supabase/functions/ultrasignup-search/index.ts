import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UltraSignupEvent {
  EventID: number;
  EventName: string;
  City: string;
  State: string;
  StartDate: string;
  Website?: string;
  Distances?: string;
}

// UltraSignup uses ASP.NET WCF format: /Date(milliseconds)/
function parseUltraSignupDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/\/Date\((\d+)\)\//);
  if (match) return new Date(parseInt(match[1], 10));
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function normalizeRace(event: UltraSignupEvent) {
  const distances = event.Distances
    ? event.Distances.split(',').map((d: string) => d.trim()).filter(Boolean)
    : [];
  const parsed = parseUltraSignupDate(event.StartDate);
  return {
    ultrasignup_race_id: event.EventID,
    name: event.EventName,
    location_city: event.City ?? null,
    location_state: event.State ?? null,
    race_date: parsed ? parsed.toISOString().split('T')[0] : null,
    distances_json: distances.length > 0 ? distances : null,
    ultrasignup_url: `https://ultrasignup.com/register.aspx?did=${event.EventID}`,
    website_url: event.Website ?? null,
    last_fetched_at: new Date().toISOString(),
  };
}

async function dbTextSearch(query: string, today: string) {
  const { data } = await supabaseAdmin
    .from('races')
    .select('id, ultrasignup_race_id, name, location_city, location_state, race_date, distances_json')
    .ilike('name', `%${query}%`)
    .gte('race_date', today)
    .order('race_date', { ascending: true })
    .limit(20);
  return data ?? [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: responseHeaders });
  }

  const { query } = await req.json();
  if (!query?.trim()) {
    return new Response(JSON.stringify({ races: [] }), { headers: responseHeaders });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

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
      .map(normalizeRace)
      .filter((r) => r.race_date && new Date(r.race_date) >= today);

    if (normalized.length > 0) {
      await supabaseAdmin.from('races').upsert(normalized, { onConflict: 'ultrasignup_race_id' });
      const raceIds = normalized.map((r) => r.ultrasignup_race_id);
      const { data: races } = await supabaseAdmin
        .from('races')
        .select('id, ultrasignup_race_id, name, location_city, location_state, race_date, distances_json')
        .in('ultrasignup_race_id', raceIds)
        .order('race_date', { ascending: true });
      return new Response(JSON.stringify({ races: races ?? [] }), { headers: responseHeaders });
    }

    // UltraSignup returned nothing — fall back to our cached races
    const cached = await dbTextSearch(query, todayStr);
    return new Response(JSON.stringify({ races: cached, cached: true }), { headers: responseHeaders });

  } catch (_err) {
    const cached = await dbTextSearch(query, todayStr);
    return new Response(JSON.stringify({ races: cached, cached: true }), { headers: responseHeaders });
  }
});
