import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useBookings } from '../../../../hooks/useBookings';
import { useAuth } from '../../../../lib/auth';
import { BookingCard } from '../../../../components/bookings/BookingCard';
import { Button } from '../../../../components/ui/Button';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { supabase } from '../../../../lib/supabase';
import { Colors, Spacing, FontSize, FontWeight } from '../../../../constants/theme';

export default function ListingRequestsScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>();
  const { user } = useAuth();
  const { receivedBookings, loading, updateBookingStatus } = useBookings(user?.id);

  const requests = receivedBookings.filter((b) => b.listing_id === listingId && b.status === 'pending');

  async function handleAccept(bookingId: string) {
    const { error } = await updateBookingStatus(bookingId, 'accepted');
    if (error) Alert.alert('Error', error);
  }

  async function handleDecline(bookingId: string) {
    Alert.alert('Decline Request', 'Are you sure you want to decline this booking request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          const { error } = await updateBookingStatus(bookingId, 'cancelled', { cancellation_reason: 'Declined by provider' });
          if (error) Alert.alert('Error', error);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Booking Requests', headerBackTitle: 'Listing' }} />
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : requests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No pending requests</Text>
          <Text style={styles.emptyText}>New booking requests will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {requests.map((booking) => (
            <View key={booking.id} style={styles.requestItem}>
              <BookingCard booking={booking} viewAs="provider" />
              <View style={styles.btnRow}>
                <Button onPress={() => handleDecline(booking.id)} variant="outline" style={styles.btn}>
                  Decline
                </Button>
                <Button onPress={() => handleAccept(booking.id)} style={styles.btn}>
                  Accept
                </Button>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  requestItem: { gap: Spacing.sm },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  btn: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
