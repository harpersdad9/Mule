import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../lib/auth';
import { useBookings } from '../../../../hooks/useBookings';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../../constants/theme';
import { formatCurrency, formatRaceDate, capitalize } from '../../../../lib/utils';

interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  role_type: string;
  rate_type: string;
  rate_amount: number;
  segment_start: string | null;
  segment_end: string | null;
  segment_miles: number | null;
  status: string;
  user_id: string;
  race_id: string;
  profile: { id: string; full_name: string; avatar_url: string | null; username: string; bio: string | null };
  race: { name: string; race_date: string; location_city: string | null; location_state: string | null };
}

export default function PublicListingScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { createBooking } = useBookings(user?.id);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listingId) return;
    supabase
      .from('listings')
      .select('*, profile:profiles(id, full_name, avatar_url, username, bio), race:races(name, race_date, location_city, location_state)')
      .eq('id', listingId)
      .single()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        setListing(data as any);
        setLoading(false);
      });
  }, [listingId]);

  async function handleRequest() {
    if (!listing || !user) return;
    setRequesting(true);
    setError('');
    const { data, error: err } = await createBooking({
      listing_id: listing.id,
      runner_id: user.id,
      provider_id: listing.user_id,
      agreed_rate_type: listing.rate_type as any,
      agreed_rate_amount: listing.rate_amount,
      agreed_role_type: listing.role_type as any,
      status: 'pending',
    });
    setRequesting(false);
    if (err) {
      setError(err);
      return;
    }
    setBookingId(data?.id ?? null);
    setRequested(true);
  }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!listing) return <View style={styles.safe}><Text style={styles.errorBanner}>{error || 'Listing not found.'}</Text></View>;

  const isOwner = listing.user_id === user?.id;
  const rate = listing.rate_type === 'flat'
    ? `${formatCurrency(listing.rate_amount)} flat fee`
    : `${formatCurrency(listing.rate_amount)} / hr`;
  const location = [listing.race.location_city, listing.race.location_state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: capitalize(listing.role_type), headerBackTitle: 'Results' }} />
      <ScrollView contentContainerStyle={styles.container}>

        {/* Provider */}
        <View style={styles.providerCard}>
          <Avatar uri={listing.profile.avatar_url} name={listing.profile.full_name} size={56} />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{listing.profile.full_name}</Text>
            <Text style={styles.providerUsername}>@{listing.profile.username}</Text>
          </View>
          <Badge label={capitalize(listing.role_type)} variant={listing.role_type as any} />
        </View>

        {/* Race */}
        <View style={styles.raceCard}>
          <Text style={styles.raceName}>{listing.race.name}</Text>
          <Text style={styles.raceMeta}>{location} · {formatRaceDate(listing.race.race_date)}</Text>
        </View>

        {/* Listing */}
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.rate}>{rate}</Text>

        {listing.segment_start ? (
          <View style={styles.segmentRow}>
            <Text style={styles.metaLabel}>Segment</Text>
            <Text style={styles.metaValue}>
              {listing.segment_start}{listing.segment_end ? ` → ${listing.segment_end}` : ''}
              {listing.segment_miles ? ` (${listing.segment_miles} mi)` : ''}
            </Text>
          </View>
        ) : null}

        {listing.description ? (
          <View>
            <Text style={styles.metaLabel}>Details</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        ) : null}

        {listing.profile.bio ? (
          <View>
            <Text style={styles.metaLabel}>About {listing.profile.full_name.split(' ')[0]}</Text>
            <Text style={styles.description}>{listing.profile.bio}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

        {/* Actions */}
        {isOwner ? (
          <Button onPress={() => router.push(`/(tabs)/listings/${listing.id}`)} variant="outline" fullWidth>
            Manage Listing
          </Button>
        ) : requested ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Request Sent!</Text>
            <Text style={styles.successText}>
              Your booking request has been sent to {listing.profile.full_name.split(' ')[0]}. You'll be notified when they respond.
            </Text>
            {bookingId ? (
              <Button onPress={() => router.replace(`/(tabs)/bookings/${bookingId}`)} fullWidth style={styles.successBtn}>
                View Booking & Message
              </Button>
            ) : null}
            <Button onPress={() => router.replace('/(tabs)/bookings')} variant="outline" fullWidth>
              View All Bookings
            </Button>
          </View>
        ) : (
          <View style={styles.bookingBox}>
            <View style={styles.bookingSummary}>
              <Text style={styles.bookingSummaryLabel}>You're requesting</Text>
              <Text style={styles.bookingSummaryValue}>{capitalize(listing.role_type)} · {rate}</Text>
              <Text style={styles.bookingSummaryRace}>{listing.race.name}</Text>
            </View>
            <Button onPress={handleRequest} loading={requesting} fullWidth size="lg">
              Send Request
            </Button>
            <Text style={styles.bookingNote}>No payment yet — the {listing.role_type} reviews and accepts first.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  providerUsername: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  raceCard: {
    padding: Spacing.md,
    backgroundColor: '#FFF5F1',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  raceName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  raceMeta: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  rate: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.primary },
  metaLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  metaValue: { fontSize: FontSize.md, color: Colors.text },
  segmentRow: { gap: 2 },
  description: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24 },
  errorBanner: { color: Colors.error, fontSize: FontSize.sm, backgroundColor: '#fee2e2', padding: Spacing.md, borderRadius: BorderRadius.md, textAlign: 'center' },
  bookingBox: {
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookingSummary: { gap: 4 },
  bookingSummaryLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  bookingSummaryValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  bookingSummaryRace: { fontSize: FontSize.sm, color: Colors.textSecondary },
  bookingNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  successBox: {
    gap: Spacing.md,
    padding: Spacing.lg,
    backgroundColor: '#f0fdf4',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: '#166534' },
  successText: { fontSize: FontSize.md, color: '#166534', lineHeight: 22 },
  successBtn: { marginTop: Spacing.xs },
});
