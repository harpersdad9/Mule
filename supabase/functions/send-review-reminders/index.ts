import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const REVIEW_TIMEOUT_DAYS = 14;

async function sendPushNotification(token: string, title: string, body: string, data: Record<string, string>) {
  await fetch(EXPO_PUSH_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
}

serve(async (_req) => {
  // 1. Complete bookings where race date has passed
  const { data: toComplete } = await supabase
    .from('bookings')
    .select('id, runner_id, provider_id, listing_id, listings(race_id, races(race_date))')
    .eq('status', 'paid');

  const now = new Date();
  const completedIds: string[] = [];

  for (const booking of toComplete ?? []) {
    const raceDate = (booking as any).listings?.races?.race_date;
    if (raceDate && new Date(raceDate) < now) {
      completedIds.push(booking.id);
    }
  }

  if (completedIds.length > 0) {
    await supabase.from('bookings').update({ status: 'completed', updated_at: now.toISOString() }).in('id', completedIds);

    // Insert review reminder notifications + send push
    for (const booking of toComplete ?? []) {
      if (!completedIds.includes(booking.id)) continue;

      await supabase.from('notifications').insert([
        {
          user_id: booking.runner_id,
          type: 'review_reminder',
          title: 'How was your race?',
          body: 'Leave a review for your pacer or crew member.',
          data_json: { bookingId: booking.id },
        },
        {
          user_id: booking.provider_id,
          type: 'review_reminder',
          title: 'Race completed!',
          body: 'Leave a review for the runner you helped.',
          data_json: { bookingId: booking.id },
        },
      ]);

      // Send push to both parties
      for (const userId of [booking.runner_id, booking.provider_id]) {
        const { data: tokens } = await supabase.from('push_tokens').select('token').eq('user_id', userId);
        for (const { token } of tokens ?? []) {
          await sendPushNotification(token, 'Race Complete!', 'Tap to leave your review.', { bookingId: booking.id });
        }
      }
    }
  }

  // 2. Trigger payouts for bookings where both reviewed OR timeout reached
  const timeoutDate = new Date(now.getTime() - REVIEW_TIMEOUT_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: readyForPayout } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'completed')
    .is('stripe_transfer_id', null)
    .or(`runner_reviewed_at.not.is.null,created_at.lt.${timeoutDate}`);

  for (const { id } of readyForPayout ?? []) {
    await supabase.functions.invoke('stripe-transfer-payout', { body: { bookingId: id } });
  }

  return new Response(JSON.stringify({
    completed: completedIds.length,
    payoutsTriggered: readyForPayout?.length ?? 0,
  }), { headers: { 'Content-Type': 'application/json' } });
});
