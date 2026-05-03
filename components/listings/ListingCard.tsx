import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { formatCurrency, capitalize } from '../../lib/utils';
import type { Database } from '../../types/database.types';

type Listing = Database['public']['Tables']['listings']['Row'];

interface ListingCardProps {
  listing: Listing;
  raceName?: string;
  onPress?: () => void;
  showStatus?: boolean;
}

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  active: 'success',
  paused: 'warning',
  filled: 'default',
  cancelled: 'error',
};

export function ListingCard({ listing, raceName, onPress, showStatus = false }: ListingCardProps) {
  const rate = listing.rate_type === 'flat'
    ? `${formatCurrency(listing.rate_amount)} flat`
    : `${formatCurrency(listing.rate_amount)}/hr`;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.8 : 1} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Badge label={capitalize(listing.role_type)} variant={listing.role_type as 'pacer' | 'crew'} />
          {showStatus && <Badge label={capitalize(listing.status)} variant={statusVariant[listing.status] ?? 'default'} />}
          <Text style={styles.rate}>{rate}</Text>
        </View>
        <Text style={styles.title}>{listing.title}</Text>
        {raceName && <Text style={styles.race}>{raceName}</Text>}
        {(listing.segment_start || listing.segment_end) && (
          <Text style={styles.segment}>
            {listing.segment_start ?? '?'} → {listing.segment_end ?? '?'}
            {listing.segment_miles ? ` (${listing.segment_miles} mi)` : ''}
          </Text>
        )}
        {listing.description && (
          <Text style={styles.description} numberOfLines={2}>{listing.description}</Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, marginBottom: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  rate: { marginLeft: 'auto', fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  race: { fontSize: FontSize.sm, color: Colors.textSecondary },
  segment: { fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
