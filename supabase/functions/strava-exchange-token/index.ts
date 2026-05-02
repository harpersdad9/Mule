import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { code } = await req.json();
  if (!code) return new Response(JSON.stringify({ error: 'code required' }), { status: 400 });

  // Exchange code for tokens
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('STRAVA_CLIENT_ID'),
      client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
      code,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return new Response(JSON.stringify({ error: 'Failed to exchange Strava token' }), { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_at, athlete } = tokenData;

  // Fetch athlete stats
  const statsRes = await fetch(`https://www.strava.com/api/v3/athletes/${athlete.id}/stats`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  let stats = null;
  let longestRunKm = null;
  if (statsRes.ok) {
    stats = await statsRes.json();
    longestRunKm = stats.biggest_run_distance ? stats.biggest_run_distance / 1000 : null;
  }

  await supabaseAdmin.from('strava_connections').upsert({
    user_id: user.id,
    strava_athlete_id: athlete.id,
    access_token,
    refresh_token,
    token_expires_at: new Date(expires_at * 1000).toISOString(),
    total_distance_km: stats ? stats.all_run_totals?.distance / 1000 : null,
    total_elevation_m: stats ? stats.all_run_totals?.elevation_gain : null,
    ytd_distance_km: stats ? stats.ytd_run_totals?.distance / 1000 : null,
    longest_run_km: longestRunKm,
    raw_stats_json: stats,
    last_synced_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return new Response(JSON.stringify({
    success: true,
    athleteName: `${athlete.firstname} ${athlete.lastname}`,
    stats: {
      totalDistanceKm: stats?.all_run_totals?.distance / 1000,
      ytdDistanceKm: stats?.ytd_run_totals?.distance / 1000,
      longestRunKm,
    },
  }), { headers: { 'Content-Type': 'application/json' } });
});
