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

  const { bookingId } = await req.json();
  if (!bookingId) return new Response(JSON.stringify({ error: 'bookingId required' }), { status: 400 });

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });
  if (booking.runner_id !== user.id) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  if (booking.status !== 'accepted') return new Response(JSON.stringify({ error: 'Booking must be accepted before payment' }), { status: 400 });

  const totalCents = booking.agreed_rate_amount;
  const platformFeeCents = Math.floor(totalCents * 0.05);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalCents,
    currency: 'usd',
    metadata: { bookingId, runnerId: booking.runner_id, providerId: booking.provider_id },
  });

  await supabaseAdmin.from('bookings').update({
    stripe_payment_intent_id: paymentIntent.id,
    platform_fee_cents: platformFeeCents,
    total_amount_cents: totalCents,
  }).eq('id', bookingId);

  return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
