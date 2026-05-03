import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const { bookingId } = await req.json();
  if (!bookingId) return new Response(JSON.stringify({ error: 'bookingId required' }), { status: 400 });

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });
  if (!['completed', 'reviewed'].includes(booking.status)) {
    return new Response(JSON.stringify({ error: 'Booking not eligible for payout' }), { status: 400 });
  }
  if (booking.stripe_transfer_id) {
    return new Response(JSON.stringify({ already: true }), { status: 200 });
  }

  const { data: stripeAccount } = await supabase.from('stripe_accounts').select('stripe_account_id').eq('user_id', booking.provider_id).single();
  if (!stripeAccount) return new Response(JSON.stringify({ error: 'Provider has no Stripe account' }), { status: 400 });

  // Get the charge from the payment intent
  const pi = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id);
  const chargeId = pi.latest_charge as string;

  const providerAmount = (booking.total_amount_cents ?? booking.agreed_rate_amount) - (booking.platform_fee_cents ?? 0);

  const transfer = await stripe.transfers.create({
    amount: providerAmount,
    currency: 'usd',
    destination: stripeAccount.stripe_account_id,
    source_transaction: chargeId,
    metadata: { bookingId },
  });

  await supabase.from('bookings').update({ stripe_transfer_id: transfer.id, updated_at: new Date().toISOString() }).eq('id', bookingId);

  // Notify provider
  await supabase.from('notifications').insert([{
    user_id: booking.provider_id,
    type: 'payout_sent',
    title: 'Payout sent!',
    body: `$${(providerAmount / 100).toFixed(2)} has been transferred to your Stripe account.`,
    data_json: { bookingId },
  }]);

  return new Response(JSON.stringify({ transferId: transfer.id }), { headers: { 'Content-Type': 'application/json' } });
});
