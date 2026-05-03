import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { StarRating } from '../ui/StarRating';
import { Button } from '../ui/Button';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

interface ReviewFormProps {
  bookingId: string;
  revieweeId: string;
  revieweeName: string;
  onSubmit: (rating: number, comment: string) => Promise<{ error: string | null }>;
}

export function ReviewForm({ revieweeName, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    const { error } = await onSubmit(rating, comment.trim());
    setSubmitting(false);
    if (error) Alert.alert('Error', error);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>How was your experience with {revieweeName}?</Text>

      <View style={styles.ratingSection}>
        <StarRating rating={rating} size={40} interactive onRate={setRating} />
        {rating > 0 && (
          <Text style={styles.ratingLabel}>
            {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
          </Text>
        )}
      </View>

      <TextInput
        style={styles.commentInput}
        value={comment}
        onChangeText={setComment}
        placeholder="Share details about your experience (optional)"
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <Button onPress={handleSubmit} loading={submitting} disabled={rating === 0} fullWidth>
        Submit Review
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  heading: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text, textAlign: 'center' },
  ratingSection: { alignItems: 'center', gap: Spacing.sm },
  ratingLabel: { fontSize: FontSize.md, color: Colors.textSecondary },
  commentInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    minHeight: 100,
    backgroundColor: Colors.surface,
  },
});
