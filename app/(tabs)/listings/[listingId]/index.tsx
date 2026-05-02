import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { useMyListings } from '../../../../hooks/useListings';
import { useAuth } from '../../../../lib/auth';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight } from '../../../../constants/theme';
import { formatCurrency, capitalize } from '../../../../lib/utils';

export default function ListingDetailScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { listings, loading, updateListing } = useMyListings(user?.id);
  const listing = listings.find((l) => l.id === listingId);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!listing) return null;

  async function toggleStatus() {
    if (!listing) return;
    const newStatus = listing.status === 'active' ? 'paused' : 'active';
    const { error } = await updateListing(listing.id, { status: newStatus });
    if (error) Alert.alert('Error', error);
  }

  const rate = listing.rate_type === 'flat'
    ? `${formatCurrency(listing.rate_amount)} flat`
    : `${formatCurrency(listing.rate_amount)}/hr`;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Listing', headerBackTitle: 'Listings' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Badge label={capitalize(listing.role_type)} variant={listing.role_type as any} />
          <Badge label={capitalize(listing.status)} variant={listing.status === 'active' ? 'success' : listing.status === 'cancelled' ? 'error' : 'warning'} />
        </View>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.rate}>{rate}</Text>
        {listing.segment_start && (
          <Text style={styles.segment}>Segment: {listing.segment_start} → {listing.segment_end ?? '?'}{listing.segment_miles ? ` (${listing.segment_miles} mi)` : ''}</Text>
        )}
        {listing.description && <Text style={styles.description}>{listing.description}</Text>}

        <View style={styles.actions}>
          <Button
            onPress={() => router.push(`/(tabs)/listings/${listing.id}/requests`)}
            variant="outline"
            fullWidth
          >
            View Booking Requests
          </Button>
          <Button onPress={toggleStatus} variant={listing.status === 'active' ? 'secondary' : 'primary'} fullWidth>
            {listing.status === 'active' ? 'Pause Listing' : 'Activate Listing'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', gap: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  rate: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.primary },
  segment: { fontSize: FontSize.md, color: Colors.textSecondary, fontStyle: 'italic' },
  description: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24 },
  actions: { gap: Spacing.md, marginTop: Spacing.lg },
});
