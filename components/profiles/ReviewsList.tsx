import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { StarRating } from '../ui/StarRating';
import { Avatar } from '../ui/Avatar';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import type { Database } from '../../types/database.types';

type Review = Database['public']['Tables']['reviews']['Row'];

interface ReviewsListProps {
  reviews: Review[];
}

function ReviewItem({ review }: { review: Review }) {
  const date = new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  return (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <View style={styles.row}>
          <Avatar name="R" size={32} />
          <View>
            <StarRating rating={review.rating} size={14} />
            <Text style={styles.date}>{date}</Text>
          </View>
        </View>
      </View>
      {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
    </View>
  );
}

export function ReviewsList({ reviews }: ReviewsListProps) {
  if (reviews.length === 0) {
    return <Text style={styles.empty}>No reviews yet.</Text>;
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => <ReviewItem review={item} />}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
}

const styles = StyleSheet.create({
  item: { gap: Spacing.sm },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  comment: { fontSize: FontSize.sm, color: Colors.text, lineHeight: 20 },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  empty: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
});
