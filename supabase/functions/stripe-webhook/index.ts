import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16', httpClient: Stripe.createFetchHttpClient() });
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

serve(async (req) => {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Webhook signature verification failed' }), { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      await supabase
        .from('bookings')
        .update({ status: 'paid', stripe_payment_intent_id: pi.id, updated_at: new Date().toISOString() })
        .eq('stripe_payment_intent_id', pi.id);

      // Notify both parties
      const { data: booking } = await supabase
        .from('bookings')
        .select('runner_id, provider_id')
        .eq('stripe_payment_intent_id', pi.id)
        .single();

      if (booking) {
        await supabase.from('notifications').insert([
          { user_id: booking.runner_id, type: 'payment_confirmed', title: 'Payment confirmed', body: 'Your booking is confirmed and paid.' },
          { user_id: booking.provider_id, type: 'payment_received', title: 'Booking paid', body: "A runner has paid for your listing. You're all set!" },
        ]);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const { data: booking } = await supabase.from('bookings').select('runner_id').eq('stripe_payment_intent_id', pi.id).single();
      if (booking) {
        await supabase.from('notifications').insert([
          { user_id: booking.runner_id, type: 'payment_failed', title: 'Payment failed', body: 'Your payment could not be processed. Please try again.' },
        ]);
      }
      break;
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      await supabase
        .from('stripe_accounts')
        .update({
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_account_id', account.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
