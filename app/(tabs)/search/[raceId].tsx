import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useRaceListings } from '../../../hooks/useListings';
import { ProfileCard } from '../../../components/profiles/ProfileCard';
import { ListingCard } from '../../../components/listings/ListingCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight } from '../../../constants/theme';
import { formatRaceDate, formatCurrency } from '../../../lib/utils';
import type { RoleType } from '../../../types/app.types';

export default function RaceDetailScreen() {
  const { raceId } = useLocalSearchParams<{ raceId: string }>();
  const [filter, setFilter] = useState<RoleType | undefined>(undefined);
  const { listings, loading } = useRaceListings(raceId, filter);

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
            <Text style={styles.emptyText}>No {filter ?? 'pacers or crew'} have posted availability for this race yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onPress={() => {}}
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
  container: { flex: 1, gap: Spacing.md },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterBtnActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  filterText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
