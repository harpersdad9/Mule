import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { StarRating } from '../ui/StarRating';
import { Card } from '../ui/Card';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';
import type { ProfileSummary } from '../../types/app.types';

interface ProfileCardProps {
  profile: ProfileSummary;
  rateDisplay?: string;
  roleType?: 'pacer' | 'crew';
  onPress?: () => void;
}

export function ProfileCard({ profile, rateDisplay, roleType, onPress }: ProfileCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) { onPress(); return; }
    router.push(`/(tabs)/search/profile/${profile.id}`);
  };

  const avgRating = profile.avg_rating ?? 0;
  const reviewCount = profile.review_count ?? 0;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Avatar uri={profile.avatar_url} name={profile.full_name} size={52} />
          <View style={styles.info}>
            <Text style={styles.name}>{profile.full_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {reviewCount > 0 && (
              <View style={styles.ratingRow}>
                <StarRating rating={Math.round(avgRating)} size={14} />
                <Text style={styles.ratingText}>{avgRating.toFixed(1)} ({reviewCount})</Text>
              </View>
            )}
          </View>
          <View style={styles.right}>
            {roleType && <Badge label={roleType} variant={roleType} />}
            {rateDisplay && <Text style={styles.rate}>{rateDisplay}</Text>}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  info: { flex: 1, gap: 2 },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  username: { fontSize: FontSize.sm, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 2 },
  ratingText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  right: { alignItems: 'flex-end', gap: Spacing.xs },
  rate: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
