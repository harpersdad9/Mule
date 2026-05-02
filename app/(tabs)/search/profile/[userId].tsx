import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useProfile } from '../../../../hooks/useProfile';
import { useReviews } from '../../../../hooks/useReviews';
import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { StarRating } from '../../../../components/ui/StarRating';
import { StravaStatsBlock } from '../../../../components/profiles/StravaStatsBlock';
import { ReviewsList } from '../../../../components/profiles/ReviewsList';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight } from '../../../../constants/theme';

export default function PublicProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { profile, strava, avgRating, reviewCount, loading } = useProfile(userId);
  const { reviews } = useReviews(userId);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: profile.full_name, headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Avatar uri={profile.avatar_url} name={profile.full_name} size={80} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{profile.full_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {profile.location_state && <Text style={styles.location}>{profile.location_state}</Text>}
            {reviewCount > 0 && (
              <View style={styles.ratingRow}>
                <StarRating rating={Math.round(avgRating ?? 0)} size={16} />
                <Text style={styles.ratingText}>{(avgRating ?? 0).toFixed(1)} · {reviewCount} reviews</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.roles}>
          {profile.is_runner && <Badge label="Runner" variant="default" />}
          {profile.is_pacer && <Badge label="Pacer" variant="pacer" />}
          {profile.is_crew && <Badge label="Crew" variant="crew" />}
        </View>

        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {strava && (
          <StravaStatsBlock
            stats={{
              total_distance_km: strava.total_distance_km,
              total_elevation_m: strava.total_elevation_m,
              ytd_distance_km: strava.ytd_distance_km,
              longest_run_km: strava.longest_run_km,
              race_count: strava.race_count,
              last_synced_at: strava.last_synced_at,
            }}
          />
        )}

        <Text style={styles.sectionTitle}>Reviews</Text>
        <ReviewsList reviews={reviews} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.lg },
  header: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' },
  headerInfo: { flex: 1, gap: Spacing.xs },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  username: { fontSize: FontSize.md, color: Colors.textSecondary },
  location: { fontSize: FontSize.sm, color: Colors.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  ratingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  roles: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  bio: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
});
