import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Config } from '../constants/config';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

export function getGoogleRedirectUri(): string {
  return Linking.createURL('google-callback');
}

export function buildGoogleAuthUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: Config.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function openGoogleAuth(): Promise<{ code: string; redirectUri: string } | { error: string }> {
  const redirectUri = getGoogleRedirectUri();
  const authUrl = buildGoogleAuthUrl(redirectUri);

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

  if (result.type !== 'success') {
    return { error: 'Sign-in was cancelled or failed' };
  }

  const parsed = Linking.parse(result.url);
  const code = parsed.queryParams?.['code'];

  if (!code || typeof code !== 'string') {
    return { error: 'No authorization code returned from Google' };
  }

  return { code, redirectUri };
}

export async function exchangeGoogleToken(
  code: string,
  redirectUri: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('google-auth-exchange', {
    body: { code, redirectUri },
  });
  return { error: error?.message ?? null };
}

export async function isGoogleConnected(): Promise<boolean> {
  const { data } = await supabase
    .from('google_connections')
    .select('id')
    .maybeSingle();
  return !!data;
}

export async function createMeetEvent(params: {
  title: string;
  startTime: string;
  durationMinutes: number;
  description?: string;
}): Promise<{ meetLink?: string; calendarLink?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('google-calendar-event', {
    body: params,
  });
  if (error) return { error: error.message };
  return { meetLink: data?.meetLink ?? undefined, calendarLink: data?.calendarLink ?? undefined };
}
