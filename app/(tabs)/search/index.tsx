import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { RaceSearchBar } from '../../../components/listings/RaceSearchBar';
import { useRaceSearch } from '../../../hooks/useRaceSearch';
import { Colors, Spacing, FontSize, FontWeight } from '../../../constants/theme';
import type { RaceOption } from '../../../types/app.types';

export default function SearchScreen() {
  const router = useRouter();
  const { query, races, loading, searchUnavailable, search, clear } = useRaceSearch();

  function handleSelect(race: RaceOption) {
    router.push(`/(tabs)/search/${race.id}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Find Pacers & Crew</Text>
        <Text style={styles.subtitle}>Search for your race to see who's available</Text>

        <RaceSearchBar
          query={query}
          onChangeText={search}
          results={races}
          loading={loading}
          searchUnavailable={searchUnavailable}
          onSelect={handleSelect}
          onClear={clear}
        />

        {!query && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏔️</Text>
            <Text style={styles.emptyTitle}>Search for a race</Text>
            <Text style={styles.emptyText}>
              Type a race name to find available pacers and crew members for that event.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.lg, gap: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: -Spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, paddingHorizontal: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
