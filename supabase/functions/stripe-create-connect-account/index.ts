import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });

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

  const { returnUrl, refreshUrl } = await req.json();

  // Check for existing Stripe account
  let { data: existing } = await supabaseAdmin.from('stripe_accounts').select('stripe_account_id').eq('user_id', user.id).single();

  let stripeAccountId = existing?.stripe_account_id;

  if (!stripeAccountId) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { mcc: '7941', url: 'https://mule.run' },
      metadata: { userId: user.id },
    });
    stripeAccountId = account.id;
    await supabaseAdmin.from('stripe_accounts').insert({
      user_id: user.id,
      stripe_account_id: stripeAccountId,
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });

  await supabaseAdmin.from('stripe_accounts').update({ onboarding_url: accountLink.url }).eq('user_id', user.id);

  return new Response(JSON.stringify({ onboardingUrl: accountLink.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
