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

  const { data: connection } = await supabaseAdmin.from('strava_connections').select('*').eq('user_id', user.id).single();
  if (!connection) return new Response(JSON.stringify({ error: 'No Strava connection found' }), { status: 404 });

  let accessToken = connection.access_token;

  // Refresh token if expired
  if (new Date(connection.token_expires_at) <= new Date()) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('STRAVA_CLIENT_ID'),
        client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
        refresh_token: connection.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    if (!refreshRes.ok) return new Response(JSON.stringify({ error: 'Failed to refresh Strava token' }), { status: 400 });
    const refreshData = await refreshRes.json();
    accessToken = refreshData.access_token;
    await supabaseAdmin.from('strava_connections').update({
      access_token: accessToken,
      refresh_token: refreshData.refresh_token,
      token_expires_at: new Date(refreshData.expires_at * 1000).toISOString(),
    }).eq('user_id', user.id);
  }

  const statsRes = await fetch(`https://www.strava.com/api/v3/athletes/${connection.strava_athlete_id}/stats`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!statsRes.ok) return new Response(JSON.stringify({ error: 'Failed to fetch Strava stats' }), { status: 400 });

  const stats = await statsRes.json();
  const longestRunKm = stats.biggest_run_distance ? stats.biggest_run_distance / 1000 : null;

  await supabaseAdmin.from('strava_connections').update({
    total_distance_km: stats.all_run_totals?.distance / 1000,
    total_elevation_m: stats.all_run_totals?.elevation_gain,
    ytd_distance_km: stats.ytd_run_totals?.distance / 1000,
    longest_run_km: longestRunKm,
    raw_stats_json: stats,
    last_synced_at: new Date().toISOString(),
  }).eq('user_id', user.id);

  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
});
