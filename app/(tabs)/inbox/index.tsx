import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { Avatar } from '../../../components/ui/Avatar';
import { BookingStatusBadge } from '../../../components/bookings/BookingStatusBadge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';

interface Conversation {
  bookingId: string;
  bookingStatus: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string | null;
  otherUsername: string;
  roleType: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastMessageMine: boolean;
  unreadCount: number;
}

export default function InboxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    setLoading(true);

    // Load all bookings with both profiles
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, agreed_role_type, runner_id, provider_id, runner:profiles!runner_id(id, full_name, avatar_url, username), provider:profiles!provider_id(id, full_name, avatar_url, username)')
      .or(`runner_id.eq.${user.id},provider_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!bookings || bookings.length === 0) { setConversations([]); setLoading(false); return; }

    const bookingIds = bookings.map((b: any) => b.id);

    // Load all messages for these bookings
    const { data: messages } = await supabase
      .from('messages')
      .select('id, booking_id, sender_id, body, created_at, read_at')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false });

    const convos: Conversation[] = bookings.map((b: any) => {
      const isRunner = b.runner_id === user.id;
      const other = isRunner ? b.provider : b.runner;
      const bookingMessages = (messages ?? []).filter((m: any) => m.booking_id === b.id);
      const latest = bookingMessages[0];
      const unread = bookingMessages.filter((m: any) => m.sender_id !== user.id && !m.read_at).length;

      return {
        bookingId: b.id,
        bookingStatus: b.status,
        otherUserId: other?.id ?? '',
        otherName: other?.full_name ?? 'Unknown',
        otherAvatar: other?.avatar_url ?? null,
        otherUsername: other?.username ?? '',
        roleType: b.agreed_role_type,
        lastMessage: latest?.body ?? null,
        lastMessageAt: latest?.created_at ?? null,
        lastMessageMine: latest?.sender_id === user.id,
        unreadCount: unread,
      };
    });

    setConversations(convos);
    setLoading(false);
  }

  useFocusEffect(useCallback(() => { load(); }, [user]));

  function timeAgo(iso: string | null) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Messages' }} />
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            When you send or receive a booking request, your conversation thread will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {conversations.map((c) => (
            <TouchableOpacity
              key={c.bookingId}
              style={[styles.row, c.unreadCount > 0 && styles.rowUnread]}
              onPress={() => router.push(`/(tabs)/bookings/${c.bookingId}`)}
              activeOpacity={0.75}
            >
              <View style={styles.avatarWrap}>
                <Avatar uri={c.otherAvatar} name={c.otherName} size={48} />
                {c.unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</Text>
                  </View>
                )}
              </View>

              <View style={styles.content}>
                <View style={styles.topRow}>
                  <Text style={styles.name} numberOfLines={1}>{c.otherName}</Text>
                  <Text style={styles.time}>{timeAgo(c.lastMessageAt)}</Text>
                </View>
                <View style={styles.bottomRow}>
                  <Text style={[styles.preview, c.unreadCount > 0 && styles.previewUnread]} numberOfLines={1}>
                    {c.lastMessage
                      ? `${c.lastMessageMine ? 'You: ' : ''}${c.lastMessage}`
                      : 'No messages yet — say hello!'}
                  </Text>
                  <BookingStatusBadge status={c.bookingStatus as any} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: Spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  rowUnread: { backgroundColor: '#FFF8F5' },
  avatarWrap: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  content: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text, flex: 1 },
  time: { fontSize: FontSize.xs, color: Colors.textMuted },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  preview: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  previewUnread: { color: Colors.text, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
