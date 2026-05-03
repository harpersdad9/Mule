import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';
import type { Database } from '../../../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function InboxScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setNotifications(data ?? []);
        setLoading(false);
      });
  }, [user]);

  async function markRead(id: string) {
    // @ts-expect-error supabase-js v2 Database generic incompatibility with hand-written types
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
  }

  function handlePress(notification: Notification) {
    markRead(notification.id);
    const data = notification.data_json as Record<string, string> | null;
    if (data?.bookingId) {
      router.push(`/(tabs)/bookings/${data.bookingId}`);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Inbox' }} />
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔔</Text>
          <Text style={styles.emptyTitle}>All caught up</Text>
          <Text style={styles.emptyText}>Booking requests, acceptances, and review reminders will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, !item.read_at && styles.unread]}
              onPress={() => handlePress(item)}
              activeOpacity={0.75}
            >
              {!item.read_at && <View style={styles.dot} />}
              <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.body && <Text style={styles.itemBody} numberOfLines={2}>{item.body}</Text>}
                <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  list: { paddingBottom: Spacing.xxl },
  item: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md, backgroundColor: Colors.surface },
  unread: { backgroundColor: '#FFF8F5' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, flexShrink: 0 },
  itemContent: { flex: 1, gap: 2 },
  itemTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  itemBody: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  itemTime: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  separator: { height: 1, backgroundColor: Colors.border },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
