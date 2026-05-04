import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useBookingDetail } from '../../../hooks/useBookings';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { openGoogleAuth, exchangeGoogleToken, isGoogleConnected, createMeetEvent } from '../../../lib/google';
import { BookingStatusBadge } from '../../../components/bookings/BookingStatusBadge';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';
import { formatCurrency, capitalize } from '../../../lib/utils';
import type { Database } from '../../../types/database.types';

type Message = Database['public']['Tables']['messages']['Row'];

const DURATIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hr', value: 60 },
  { label: '90 min', value: 90 },
  { label: '2 hr', value: 120 },
];

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const { booking, loading } = useBookingDetail(bookingId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Call panel state
  const [showCallPanel, setShowCallPanel] = useState(false);
  const [callType, setCallType] = useState<'meet' | 'phone'>('meet');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetDuration, setMeetDuration] = useState(60);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneTime, setPhoneTime] = useState('');

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
    setSending(false);
  }

  async function openCallPanel() {
    setShowCallPanel(true);
    setGoogleError('');
    const connected = await isGoogleConnected();
    setGoogleConnected(connected);
  }

  async function handleConnectGoogle() {
    setConnectingGoogle(true);
    setGoogleError('');
    const result = await openGoogleAuth();
    if ('error' in result) {
      setGoogleError(result.error);
      setConnectingGoogle(false);
      return;
    }
    const { error } = await exchangeGoogleToken(result.code, result.redirectUri);
    if (error) {
      setGoogleError(error);
    } else {
      setGoogleConnected(true);
    }
    setConnectingGoogle(false);
  }

  async function handleCreateMeeting() {
    if (!meetDate || !meetTime) return;
    setCreatingMeet(true);
    setGoogleError('');

    const startTime = new Date(`${meetDate}T${meetTime}:00`).toISOString();
    const title = `${capitalize(booking?.agreed_role_type ?? 'Call')} — Mule`;

    const { meetLink, calendarLink, error } = await createMeetEvent({
      title,
      startTime,
      durationMinutes: meetDuration,
      description: `Booking chat for your upcoming race.`,
    });

    if (error) {
      setGoogleError(error);
      setCreatingMeet(false);
      return;
    }

    const parts = [`📹 Google Meet call`];
    const dateLabel = new Date(`${meetDate}T${meetTime}:00`).toLocaleString([], {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    parts.push(`🗓 ${dateLabel} · ${DURATIONS.find((d) => d.value === meetDuration)?.label}`);
    if (meetLink) parts.push(`Join: ${meetLink}`);
    if (calendarLink) parts.push(`Calendar: ${calendarLink}`);

    sendMessage(parts.join('\n'));
    setShowCallPanel(false);
    setMeetDate('');
    setMeetTime('');
    setCreatingMeet(false);
  }

  function handleSendPhoneCall() {
    if (!phoneTime.trim() && !phoneNumber.trim()) return;
    const parts = ['📞 Phone call request'];
    if (phoneTime.trim()) parts.push(`Suggested time: ${phoneTime.trim()}`);
    if (phoneNumber.trim()) parts.push(`Call/text: ${phoneNumber.trim()}`);
    sendMessage(parts.join('\n'));
    setShowCallPanel(false);
    setPhoneNumber('');
    setPhoneTime('');
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
              <Text style={styles.emptyMessagesText}>No messages yet. Send a message to get started!</Text>
            </View>
          )}
          {messages.map((msg) => {
            const mine = msg.sender_id === user?.id;
            const isCallMsg = msg.body.startsWith('📹') || msg.body.startsWith('📞');
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
            <View style={styles.callPanelHeader}>
              <Text style={styles.callPanelTitle}>Schedule a Call</Text>
              <TouchableOpacity onPress={() => setShowCallPanel(false)}>
                <Text style={styles.callPanelClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Type tabs */}
            <View style={styles.callTypeTabs}>
              <TouchableOpacity
                style={[styles.callTypeTab, callType === 'meet' && styles.callTypeTabActive]}
                onPress={() => { setCallType('meet'); setGoogleError(''); }}
              >
                <Text style={[styles.callTypeTabText, callType === 'meet' && styles.callTypeTabTextActive]}>
                  📹 Google Meet
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callTypeTab, callType === 'phone' && styles.callTypeTabActive]}
                onPress={() => { setCallType('phone'); setGoogleError(''); }}
              >
                <Text style={[styles.callTypeTabText, callType === 'phone' && styles.callTypeTabTextActive]}>
                  📞 Phone Call
                </Text>
              </TouchableOpacity>
            </View>

            {googleError ? <Text style={styles.callError}>{googleError}</Text> : null}

            {callType === 'meet' ? (
              googleConnected ? (
                <View style={styles.meetForm}>
                  <Text style={styles.callFieldLabel}>Date</Text>
                  <TextInput
                    style={styles.callInput}
                    value={meetDate}
                    onChangeText={setMeetDate}
                    placeholder="YYYY-MM-DD (e.g. 2026-06-14)"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={styles.callFieldLabel}>Time</Text>
                  <TextInput
                    style={styles.callInput}
                    value={meetTime}
                    onChangeText={setMeetTime}
                    placeholder="HH:MM (24-hour, e.g. 14:00)"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={styles.callFieldLabel}>Duration</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationRow}>
                    {DURATIONS.map((d) => (
                      <TouchableOpacity
                        key={d.value}
                        style={[styles.durationChip, meetDuration === d.value && styles.durationChipActive]}
                        onPress={() => setMeetDuration(d.value)}
                      >
                        <Text style={[styles.durationText, meetDuration === d.value && styles.durationTextActive]}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <Button
                    onPress={handleCreateMeeting}
                    loading={creatingMeet}
                    disabled={!meetDate.trim() || !meetTime.trim()}
                    fullWidth
                  >
                    Create Meeting & Send Link
                  </Button>
                </View>
              ) : (
                <View style={styles.connectPrompt}>
                  <Text style={styles.connectText}>
                    Connect Google Calendar to create a Meet link and add the event to your calendar automatically.
                  </Text>
                  <Button onPress={handleConnectGoogle} loading={connectingGoogle} fullWidth>
                    Connect Google Calendar
                  </Button>
                </View>
              )
            ) : (
              <View style={styles.phoneForm}>
                <Text style={styles.callFieldLabel}>Your phone number</Text>
                <TextInput
                  style={styles.callInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="e.g. (555) 867-5309"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
                <Text style={styles.callFieldLabel}>Suggested time</Text>
                <TextInput
                  style={styles.callInput}
                  value={phoneTime}
                  onChangeText={setPhoneTime}
                  placeholder="e.g. Sat June 14 at 2pm PT"
                  placeholderTextColor={Colors.textMuted}
                />
                <Button
                  onPress={handleSendPhoneCall}
                  disabled={!phoneNumber.trim() && !phoneTime.trim()}
                  fullWidth
                >
                  Send Phone Call Request
                </Button>
              </View>
            )}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            onPress={() => showCallPanel ? setShowCallPanel(false) : openCallPanel()}
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
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    maxHeight: 420,
  },
  callPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  callPanelTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  callPanelClose: { fontSize: FontSize.md, color: Colors.textMuted, paddingHorizontal: Spacing.sm },
  callTypeTabs: { flexDirection: 'row', gap: Spacing.sm },
  callTypeTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  callTypeTabActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  callTypeTabText: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },
  callTypeTabTextActive: { color: Colors.primary, fontWeight: '600' },
  callError: { fontSize: FontSize.sm, color: Colors.error, backgroundColor: '#fee2e2', padding: Spacing.sm, borderRadius: BorderRadius.sm },
  callFieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  callInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  meetForm: { gap: Spacing.sm },
  durationRow: { flexDirection: 'row', marginBottom: Spacing.xs },
  durationChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
    backgroundColor: Colors.background,
  },
  durationChipActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  durationText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  durationTextActive: { color: Colors.primary, fontWeight: '600' },
  connectPrompt: { gap: Spacing.md },
  connectText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  phoneForm: { gap: Spacing.sm },
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
