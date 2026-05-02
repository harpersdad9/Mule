import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { useBookings } from '../../../hooks/useBookings';
import { useAuth } from '../../../lib/auth';
import { BookingCard } from '../../../components/bookings/BookingCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight } from '../../../constants/theme';

export default function BookingsScreen() {
  const { user } = useAuth();
  const { sentBookings, receivedBookings, loading } = useBookings(user?.id);
  const [tab, setTab] = useState<'sent' | 'received'>('sent');

  const bookings = tab === 'sent' ? sentBookings : receivedBookings;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Bookings' }} />
      <View style={styles.tabBar}>
        {(['sent', 'received'] as const).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'sent' ? 'My Requests' : 'Received'}{' '}
              {t === 'received' && receivedBookings.filter((b) => b.status === 'pending').length > 0
                ? `(${receivedBookings.filter((b) => b.status === 'pending').length})`
                : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <LoadingSpinner fullScreen />
      ) : bookings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>{tab === 'sent' ? 'No bookings yet' : 'No requests received'}</Text>
          <Text style={styles.emptyText}>
            {tab === 'sent'
              ? 'Find a race and book a pacer or crew member to get started.'
              : 'Once runners book your listings, their requests will appear here.'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} viewAs={tab === 'sent' ? 'runner' : 'provider'} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  tabBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
