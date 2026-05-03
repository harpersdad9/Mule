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

interface ListingWithDetails {
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
  const { user, profile } = useAuth();
  const router = useRouter();
  const { createBooking } = useBookings(user?.id);
  const [listing, setListing] = useState<ListingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
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
    if (err) { setError(err); return; }
    router.replace(`/(tabs)/bookings/${data?.id}`);
  }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!listing) return null;

  const isOwner = listing.user_id === user?.id;
  const isRunner = profile?.is_runner;
  const rate = listing.rate_type === 'flat'
    ? `${formatCurrency(listing.rate_amount)} flat fee`
    : `${formatCurrency(listing.rate_amount)} / hr`;
  const location = [listing.race.location_city, listing.race.location_state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: capitalize(listing.role_type), headerBackTitle: 'Results' }} />
      <ScrollView contentContainerStyle={styles.container}>

        {/* Provider info */}
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

        {/* Listing details */}
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.rate}>{rate}</Text>

        {listing.segment_start && (
          <View style={styles.segmentRow}>
            <Text style={styles.segmentLabel}>Segment</Text>
            <Text style={styles.segmentValue}>
              {listing.segment_start}{listing.segment_end ? ` → ${listing.segment_end}` : ''}
              {listing.segment_miles ? ` (${listing.segment_miles} mi)` : ''}
            </Text>
          </View>
        )}

        {listing.description ? (
          <View>
            <Text style={styles.descLabel}>About</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>
        ) : null}

        {listing.profile.bio ? (
          <View>
            <Text style={styles.descLabel}>About {listing.profile.full_name.split(' ')[0]}</Text>
            <Text style={styles.description}>{listing.profile.bio}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {isOwner ? (
          <Button onPress={() => router.push(`/(tabs)/listings/${listing.id}`)} variant="outline" fullWidth>
            Manage Listing
          </Button>
        ) : isRunner ? (
          <Button onPress={handleRequest} loading={requesting} fullWidth size="lg">
            Request Booking
          </Button>
        ) : (
          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>Add the Runner role on your profile to book pacers and crew.</Text>
            <Button onPress={() => router.push('/(tabs)/profile')} variant="outline" size="sm" style={styles.noticeBtn}>
              Update Profile
            </Button>
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
  segmentRow: { gap: 4 },
  segmentLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  segmentValue: { fontSize: FontSize.md, color: Colors.text },
  descLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.xs },
  description: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24 },
  errorText: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center' },
  noticeBox: { gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  noticeText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  noticeBtn: { marginTop: Spacing.xs },
});
