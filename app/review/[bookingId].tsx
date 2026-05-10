import React from 'react';
import { View, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../lib/auth';
import { useBookingDetail, useBookings } from '../../hooks/useBookings';
import { useReviews } from '../../hooks/useReviews';
import { ReviewForm } from '../../components/reviews/ReviewForm';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Spacing } from '../../constants/theme';

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { booking, loading } = useBookingDetail(bookingId);
  const { submitReview } = useReviews(undefined);
  const { updateBookingStatus } = useBookings(user?.id);

  if (loading) return <LoadingSpinner fullScreen />;
  if (!booking || !user) return null;

  const safeBooking = booking;
  const safeUser = user;
  const isRunner = safeBooking.runner_id === safeUser.id;
  const revieweeId = isRunner ? safeBooking.provider_id : safeBooking.runner_id;

  async function handleSubmit(rating: number, comment: string) {
    const { error } = await submitReview({
      booking_id: bookingId!,
      reviewer_id: safeUser.id,
      reviewee_id: revieweeId,
      rating,
      comment: comment || null,
      photos_json: null,
    });

    if (!error) {
      const now = new Date().toISOString();
      const updates = isRunner
        ? { runner_reviewed_at: now }
        : { provider_reviewed_at: now };

      const bothReviewed =
        (isRunner && !!safeBooking.provider_reviewed_at) ||
        (!isRunner && !!safeBooking.runner_reviewed_at);

      await updateBookingStatus(
        bookingId!,
        bothReviewed ? 'reviewed' : safeBooking.status as any,
        updates
      );

      Alert.alert('Review submitted!', 'Thank you for your feedback.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    }

    return { error };
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ReviewForm
          bookingId={bookingId!}
          revieweeId={revieweeId}
          revieweeName="your partner"
          onSubmit={handleSubmit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'center' },
});
