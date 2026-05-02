import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useBookingDetail } from '../../../hooks/useBookings';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { BookingStatusBadge } from '../../../components/bookings/BookingStatusBadge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';
import { formatCurrency, capitalize } from '../../../lib/utils';
import type { Database } from '../../../types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { booking, loading } = useBookingDetail(bookingId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!bookingId) return;
    loadMessages();

    const channel = supabase
      .channel(`booking-messages-${bookingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        scrollRef.current?.scrollToEnd({ animated: true });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true });
    setMessages(data ?? []);
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user || !bookingId) return;
    setSending(true);
    const text = newMessage.trim();
    setNewMessage('');
    await supabase.from('messages').insert({ booking_id: bookingId, sender_id: user.id, body: text } as any);
    setSending(false);
  }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!booking) return null;

  const isRunner = booking.runner_id === user?.id;
  const amount = booking.total_amount_cents ? formatCurrency(booking.total_amount_cents) : `${formatCurrency(booking.agreed_rate_amount)} ${booking.agreed_rate_type}`;
  const canReview = booking.status === 'completed' || booking.status === 'reviewed';
  const hasReviewed = isRunner ? !!booking.runner_reviewed_at : !!booking.provider_reviewed_at;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: capitalize(booking.agreed_role_type), headerBackTitle: 'Bookings' }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.container} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          <View style={styles.summary}>
            <BookingStatusBadge status={booking.status as any} />
            <Text style={styles.amount}>{amount}</Text>
            <Text style={styles.role}>{capitalize(booking.agreed_role_type)} · {booking.agreed_rate_type}</Text>
          </View>

          <Text style={styles.sectionTitle}>Messages</Text>
          {messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            return (
              <View key={msg.id} style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{msg.body}</Text>
              </View>
            );
          })}

          {canReview && !hasReviewed && (
            <Button onPress={() => router.push(`/review/${bookingId}`)} style={styles.reviewBtn} fullWidth>
              Leave a Review
            </Button>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity onPress={sendMessage} disabled={!newMessage.trim() || sending} style={styles.sendBtn}>
            <Text style={[styles.sendText, (!newMessage.trim() || sending) && styles.sendDisabled]}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  container: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl },
  summary: { gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border },
  amount: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  role: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, marginTop: Spacing.sm },
  bubble: { maxWidth: '80%', padding: Spacing.sm + 2, borderRadius: BorderRadius.md },
  bubbleMine: { alignSelf: 'flex-end', backgroundColor: Colors.primary },
  bubbleTheirs: { alignSelf: 'flex-start', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  bubbleText: { fontSize: FontSize.md, color: Colors.text },
  bubbleTextMine: { color: Colors.white },
  reviewBtn: { marginTop: Spacing.md },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: Spacing.md, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.surface },
  messageInput: { flex: 1, maxHeight: 100, fontSize: FontSize.md, color: Colors.text, padding: Spacing.sm },
  sendBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  sendText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
  sendDisabled: { color: Colors.textMuted },
});
