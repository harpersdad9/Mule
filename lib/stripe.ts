import { supabase } from './supabase';

export async function createPaymentIntent(bookingId: string): Promise<{ clientSecret: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('stripe-create-payment-intent', {
    body: { bookingId },
  });

  if (error) return { clientSecret: null, error: error.message };
  return { clientSecret: data?.clientSecret ?? null, error: null };
}

export async function createConnectAccount(
  returnUrl: string,
  refreshUrl: string
): Promise<{ onboardingUrl: string | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('stripe-create-connect-account', {
    body: { returnUrl, refreshUrl },
  });

  if (error) return { onboardingUrl: null, error: error.message };
  return { onboardingUrl: data?.onboardingUrl ?? null, error: null };
}
