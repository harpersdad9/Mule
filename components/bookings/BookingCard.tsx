import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '../ui/Card';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { formatCurrency, capitalize } from '../../lib/utils';
import type { Database } from '../../types/database.types';

type Booking = Database['public']['Tables']['bookings']['Row'];

interface BookingCardProps {
  booking: Booking;
  viewAs: 'runner' | 'provider';
  raceName?: string;
  otherPartyName?: string;
}

export function BookingCard({ booking, viewAs, raceName, otherPartyName }: BookingCardProps) {
  const router = useRouter();

  const amount = booking.total_amount_cents
    ? formatCurrency(booking.total_amount_cents)
    : `${formatCurrency(booking.agreed_rate_amount)} ${booking.agreed_rate_type}`;

  return (
    <TouchableOpacity onPress={() => router.push(`/(tabs)/bookings/${booking.id}`)} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <BookingStatusBadge status={booking.status as any} />
          <Text style={styles.amount}>{amount}</Text>
        </View>
        {raceName && <Text style={styles.race}>{raceName}</Text>}
        <View style={styles.meta}>
          <Text style={styles.metaText}>{capitalize(booking.agreed_role_type)}</Text>
          {otherPartyName && (
            <Text style={styles.metaText}>
              {viewAs === 'runner' ? 'With' : 'For'}: {otherPartyName}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, marginBottom: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  race: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  meta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
