import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { Card } from '../ui/Card';
import type { StravaStats } from '../../types/app.types';
import { formatDistance, formatElevation } from '../../lib/utils';

interface StravaStatsBlockProps {
  stats: StravaStats;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function StravaStatsBlock({ stats }: StravaStatsBlockProps) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.stravaLogo}>S</Text>
        <Text style={styles.title}>Strava Stats</Text>
        {stats.last_synced_at && (
          <Text style={styles.synced}>
            Synced {new Date(stats.last_synced_at).toLocaleDateString()}
          </Text>
        )}
      </View>
      <View style={styles.grid}>
        {stats.total_distance_km != null && (
          <Stat label="All-time distance" value={formatDistance(stats.total_distance_km)} />
        )}
        {stats.ytd_distance_km != null && (
          <Stat label="This year" value={formatDistance(stats.ytd_distance_km)} />
        )}
        {stats.longest_run_km != null && (
          <Stat label="Longest run" value={formatDistance(stats.longest_run_km)} />
        )}
        {stats.total_elevation_m != null && (
          <Stat label="All-time vert" value={formatElevation(stats.total_elevation_m)} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stravaLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.stravaOrange,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: FontWeight.heavy,
    fontSize: FontSize.md,
    overflow: 'hidden',
  },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  synced: { fontSize: FontSize.xs, color: Colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  stat: { minWidth: '45%' },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
