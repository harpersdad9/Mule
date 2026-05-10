import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useRaceListings } from '../../../hooks/useListings';
import { useBookings } from '../../../hooks/useBookings';
import { useAuth } from '../../../lib/auth';
import { ListingCard } from '../../../components/listings/ListingCard';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';
import { formatRaceDate, formatCurrency, capitalize } from '../../../lib/utils';
import type { RoleType } from '../../../types/app.types';

type Listing = ReturnType<typeof useRaceListings>['listings'][number];

export default function RaceDetailScreen() {
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { createBooking } = useBookings(user?.id);

  const [filter, setFilter] = useState<RoleType | undefined>(undefined);
  const { listings, loading } = useRaceListings(raceId, filter);

  const [selected, setSelected] = useState<Listing | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookedId, setBookedId] = useState<string | null>(null);

  async function handleRequest() {
    if (!selected || !user) return;
    setRequesting(true);
    setBookingError('');
    const { data, error } = await createBooking({
      listing_id: selected.id,
      runner_id: user.id,
      provider_id: selected.user_id,
      agreed_rate_type: selected.rate_type as any,
      agreed_rate_amount: selected.rate_amount,
      agreed_role_type: selected.role_type as any,
      status: 'pending',
    });
    setRequesting(false);
    if (error) { setBookingError(error); return; }
    setBookedId(data?.id ?? null);
  }

  const rate = selected
    ? selected.rate_type === 'flat'
      ? `${formatCurrency(selected.rate_amount)} flat`
      : `${formatCurrency(selected.rate_amount)}/hr`
    : '';

  // — Booking detail panel —
  if (selected) {
    if (bookedId) {
      return (
        <SafeAreaView style={styles.safe}>
          <Stack.Screen options={{ headerShown: true, headerTitle: 'Request Sent', headerBackTitle: 'Results' }} />
          <View style={styles.successScreen}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successTitle}>Request sent!</Text>
            <Text style={styles.successText}>
              Your request has been sent to {selected.profile.full_name.split(' ')[0]}.
              They'll review it and respond — you can message them while you wait.
            </Text>
            <Button onPress={() => router.push(`/(tabs)/bookings/${bookedId}`)} fullWidth size="lg">
              View Booking & Message
            </Button>
            <Button onPress={() => router.replace('/(tabs)/bookings')} variant="outline" fullWidth>
              All Bookings
            </Button>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <Stack.Screen options={{ headerShown: true, headerTitle: capitalize(selected.role_type), headerBackTitle: 'Results' }} />
        <ScrollView contentContainerStyle={styles.detailContainer}>
          {/* Provider */}
          <View style={styles.providerCard}>
            <Avatar uri={selected.profile.avatar_url} name={selected.profile.full_name} size={52} />
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{selected.profile.full_name}</Text>
              <Text style={styles.providerHandle}>@{selected.profile.username}</Text>
            </View>
            <Badge label={capitalize(selected.role_type)} variant={selected.role_type as any} />
          </View>

          <Text style={styles.listingTitle}>{selected.title}</Text>
          <Text style={styles.listingRate}>{rate}</Text>

          {selected.segment_start ? (
            <View>
              <Text style={styles.metaLabel}>Segment</Text>
              <Text style={styles.metaValue}>
                {selected.segment_start}{selected.segment_end ? ` → ${selected.segment_end}` : ''}
                {selected.segment_miles ? ` · ${selected.segment_miles} mi` : ''}
              </Text>
            </View>
          ) : null}

          {selected.description ? (
            <View>
              <Text style={styles.metaLabel}>Details</Text>
              <Text style={styles.metaValue}>{selected.description}</Text>
            </View>
          ) : null}

          {/* Booking box */}
          <View style={styles.bookingBox}>
            <Text style={styles.bookingBoxTitle}>Ready to request?</Text>
            <Text style={styles.bookingBoxNote}>No payment yet — {selected.profile.full_name.split(' ')[0]} reviews and accepts first.</Text>
            {bookingError ? <Text style={styles.errorText}>{bookingError}</Text> : null}
            <Button onPress={handleRequest} loading={requesting} fullWidth size="lg">
              Send Request
            </Button>
          </View>

          <Button onPress={() => { setSelected(null); setBookingError(''); }} variant="ghost" fullWidth>
            ← Back to results
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // — Race listings list —
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Available Help', headerBackTitle: 'Search' }} />
      <View style={styles.container}>
        <View style={styles.filterRow}>
          {([undefined, 'pacer', 'crew'] as const).map((role) => (
            <TouchableOpacity
              key={role ?? 'all'}
              style={[styles.filterBtn, filter === role && styles.filterBtnActive]}
              onPress={() => setFilter(role)}
            >
              <Text style={[styles.filterText, filter === role && styles.filterTextActive]}>
                {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <LoadingSpinner fullScreen />
        ) : listings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🦌</Text>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptyText}>
              No {filter ?? 'pacers or crew'} have posted availability for this race yet.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPress={() => { setSelected(listing); setBookedId(null); setBookingError(''); }}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  // List view
  container: { flex: 1, gap: Spacing.md },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  filterBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  // Detail view
  detailContainer: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  providerInfo: { flex: 1 },
  providerName: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  providerHandle: { fontSize: FontSize.sm, color: Colors.textSecondary },
  listingTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  listingRate: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.primary },
  metaLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  metaValue: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  bookingBox: { gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  bookingBoxTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  bookingBoxNote: { fontSize: FontSize.sm, color: Colors.textSecondary },
  errorText: { fontSize: FontSize.sm, color: Colors.error, backgroundColor: '#fee2e2', padding: Spacing.sm, borderRadius: BorderRadius.sm },
  // Success view
  successScreen: { flex: 1, padding: Spacing.xl, gap: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  successEmoji: { fontSize: 64 },
  successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  successText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
