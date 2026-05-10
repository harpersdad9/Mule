import { useState } from 'react';
import { openStravaAuth, exchangeStravaToken, syncStravaStats } from '../lib/strava';

export function useStravaSync() {
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect(): Promise<{ success: boolean }> {
    setConnecting(true);
    setError(null);

    const authResult = await openStravaAuth();
    if ('error' in authResult) {
      setError(authResult.error);
      setConnecting(false);
      return { success: false };
    }

    const { error: exchangeError } = await exchangeStravaToken(authResult.code);
    if (exchangeError) {
      setError(exchangeError);
      setConnecting(false);
      return { success: false };
    }

    setConnecting(false);
    return { success: true };
  }

  async function sync(): Promise<{ success: boolean }> {
    setSyncing(true);
    setError(null);
    const { error: syncError } = await syncStravaStats();
    if (syncError) setError(syncError);
    setSyncing(false);
    return { success: !syncError };
  }

  return { connect, sync, connecting, syncing, error };
}
