import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
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

const CALL_PLATFORMS = [
  { id: 'zoom', label: 'Zoom', icon: '🎥' },
  { id: 'meet', label: 'Google Meet', icon: '📹' },
  { id: 'facetime', label: 'FaceTime', icon: '📱' },
  { id: 'phone', label: 'Phone call', icon: '📞' },
];

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { booking, loading } = useBookingDetail(bookingId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showCallPanel, setShowCallPanel] = useState(false);
  const [callPlatform, setCallPlatform] = useState('zoom');
  const [callLink, setCallLink] = useState('');
  const [callTime, setCallTime] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!bookingId) return;
    loadMessages();

    const channel = supabase
      .channel(`booking-messages-${bookingId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` }, (payload) => {
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
    setSending(false);
  }

  function sendCallInvite() {
    const platform = CALL_PLATFORMS.find((p) => p.id === callPlatform);
    const parts = [`${platform?.icon} ${platform?.label} call request`];
    if (callTime.trim()) parts.push(`Suggested time: ${callTime.trim()}`);
    if (callLink.trim()) parts.push(`Link: ${callLink.trim()}`);
    sendMessage(parts.join('\n'));
    setShowCallPanel(false);
    setCallLink('');
    setCallTime('');
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
      <Stack.Screen options={{ headerShown: true, headerTitle: capitalize(booking.agreed_role_type), headerBackTitle: 'Messages' }} />
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
              <Text style={styles.emptyMessagesText}>No messages yet. Send a message to get started!</Text>
            </View>
          )}
          {messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            const isCallMsg = msg.body.startsWith('🎥') || msg.body.startsWith('📹') || msg.body.startsWith('📱') || msg.body.startsWith('📞');
            return (
              <View key={msg.id} style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
                <View style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleTheirs,
                  isCallMsg && styles.bubbleCall,
                ]}>
                  <Text style={[styles.bubbleText, mine && !isCallMsg && styles.bubbleTextMine]}>{msg.body}</Text>
                  <Text style={[styles.bubbleTime, mine && !isCallMsg && styles.bubbleTimeMine]}>
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

        {/* Schedule Call panel */}
        {showCallPanel && (
          <View style={styles.callPanel}>
            <Text style={styles.callPanelTitle}>Schedule a Call</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformRow}>
              {CALL_PLATFORMS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.platformChip, callPlatform === p.id && styles.platformChipActive]}
                  onPress={() => setCallPlatform(p.id)}
                >
                  <Text style={styles.platformIcon}>{p.icon}</Text>
                  <Text style={[styles.platformLabel, callPlatform === p.id && styles.platformLabelActive]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={styles.callInput}
              value={callTime}
              onChangeText={setCallTime}
              placeholder="Suggested time (e.g. Sat June 14 at 2pm PT)"
              placeholderTextColor={Colors.textMuted}
            />
            <TextInput
              style={styles.callInput}
              value={callLink}
              onChangeText={setCallLink}
              placeholder="Meeting link (optional)"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
            <View style={styles.callActions}>
              <Button onPress={() => setShowCallPanel(false)} variant="outline" style={styles.callBtn}>Cancel</Button>
              <Button onPress={sendCallInvite} style={styles.callBtn} disabled={!callTime.trim() && !callLink.trim()}>
                Send Invite
              </Button>
            </View>
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            onPress={() => setShowCallPanel((v) => !v)}
            style={[styles.callToggle, showCallPanel && styles.callToggleActive]}
          >
            <Text style={styles.callToggleIcon}>📞</Text>
          </TouchableOpacity>
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
            style={styles.sendBtn}
          >
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
  messageListContent: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xxl },
  emptyMessages: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyMessagesText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  bubbleWrap: { maxWidth: '80%' },
  bubbleWrapMine: { alignSelf: 'flex-end' },
  bubbleWrapTheirs: { alignSelf: 'flex-start' },
  bubble: { padding: Spacing.sm + 2, borderRadius: BorderRadius.lg, gap: 2 },
  bubbleMine: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleCall: { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1 },
  bubbleText: { fontSize: FontSize.md, color: Colors.text, lineHeight: 20 },
  bubbleTextMine: { color: Colors.white },
  bubbleTime: { fontSize: 10, color: Colors.textMuted, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)' },
  reviewBtn: { marginTop: Spacing.md },
  // Call panel
  callPanel: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  callPanelTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  platformRow: { flexDirection: 'row' },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    backgroundColor: Colors.background,
  },
  platformChipActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  platformIcon: { fontSize: 16 },
  platformLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  platformLabelActive: { color: Colors.primary, fontWeight: '600' },
  callInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  callActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  callBtn: { flex: 1 },
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
  callToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  callToggleActive: { backgroundColor: '#FFF5F1', borderColor: Colors.primary },
  callToggleIcon: { fontSize: 16 },
  messageInput: { flex: 1, maxHeight: 100, fontSize: FontSize.md, color: Colors.text, padding: Spacing.sm },
  sendBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  sendText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
  sendDisabled: { color: Colors.textMuted },
});
