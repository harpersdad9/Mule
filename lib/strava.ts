import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Config } from '../constants/config';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export function buildStravaAuthUrl(): string {
  const redirectUri = Linking.createURL('strava-callback');
  const params = new URLSearchParams({
    client_id: Config.stravaClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,profile:read_all',
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function openStravaAuth(): Promise<{ code: string } | { error: string }> {
  const redirectUri = Linking.createURL('strava-callback');
  const authUrl = buildStravaAuthUrl();

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success') {
    return { error: 'Auth session cancelled or failed' };
  }

  const parsed = Linking.parse(result.url);
  const code = parsed.queryParams?.['code'];

  if (!code || typeof code !== 'string') {
    return { error: 'No code returned from Strava' };
  }

  return { code };
}

export async function exchangeStravaToken(code: string): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('strava-exchange-token', {
    body: { code },
  });
  return { error: error?.message ?? null };
}

export async function syncStravaStats(): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('strava-sync-stats', {
    body: {},
  });
  return { error: error?.message ?? null };
}
