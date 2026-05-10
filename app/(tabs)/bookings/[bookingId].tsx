import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
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

const QUICK_EMOJIS = ['👍', '✅', '💪', '🔥', '🙏', '😊', '🏃', '💨', '🎽', '📍'];

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
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [bookingId]);

  async function loadMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
  }

  async function sendMessage(text?: string) {
    const body = (text ?? newMessage).trim();
    if (!body || !user || !bookingId) return;
    setSending(true);
    if (!text) setNewMessage('');
    await supabase.from('messages').insert({ booking_id: bookingId, sender_id: user.id, body } as any);
    // Fire-and-forget push notification to the other party
    supabase.functions.invoke('send-message-notification', {
      body: { bookingId, messageBody: body, senderId: user.id },
    });
    setSending(false);
  }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!booking) return null;

  const isRunner = booking.runner_id === user?.id;
  const amount = booking.total_amount_cents
    ? formatCurrency(booking.total_amount_cents)
    : `${formatCurrency(booking.agreed_rate_amount)} ${booking.agreed_rate_type}`;
  const canReview = booking.status === 'completed' || booking.status === 'reviewed';
  const hasReviewed = isRunner ? !!booking.runner_reviewed_at : !!booking.provider_reviewed_at;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{
        headerShown: true,
        headerTitle: capitalize(booking.agreed_role_type),
        headerBackTitle: 'Messages',
      }} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Summary bar */}
        <View style={styles.summary}>
          <BookingStatusBadge status={booking.status as any} />
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.role}>{capitalize(booking.agreed_role_type)} · {booking.agreed_rate_type}</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 && (
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyMessagesText}>No messages yet — say hello!</Text>
            </View>
          )}
          {messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            return (
              <View key={msg.id} style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{msg.body}</Text>
                  <Text style={[styles.bubbleTime, mine && styles.bubbleTimeMine]}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          })}

          {canReview && !hasReviewed && (
            <Button onPress={() => router.push(`/review/${bookingId}`)} style={styles.reviewBtn} fullWidth>
              Leave a Review
            </Button>
          )}
        </ScrollView>

        {/* Quick emoji bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.emojiBar}
          contentContainerStyle={styles.emojiBarContent}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiBtn}
              onPress={() => sendMessage(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            placeholderTextColor={Colors.textMuted}
            multiline
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            onPress={() => sendMessage()}
            disabled={!newMessage.trim() || sending}
            style={[styles.sendBtn, (!newMessage.trim() || sending) && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  amount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  role: { fontSize: FontSize.sm, color: Colors.textSecondary },
  messageList: { flex: 1 },
  messageListContent: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  emptyMessages: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyMessagesText: { fontSize: FontSize.md, color: Colors.textMuted },
  bubbleWrap: { maxWidth: '80%' },
  bubbleWrapMine: { alignSelf: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start' },
  bubble: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: 18, gap: 2 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 20 },
  bubbleTextMine: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },
  reviewBtn: { marginTop: Spacing.md },
  // Emoji bar
  emojiBar: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    maxHeight: 48,
  },
  emojiBarContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emojiText: { fontSize: 20 },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
    fontSize: FontSize.md,
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.border },
  sendText: { fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold, marginTop: -2 },
});
