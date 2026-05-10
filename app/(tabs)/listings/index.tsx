import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useMyListings } from '../../../hooks/useListings';
import { useAuth } from '../../../lib/auth';
import { ListingCard } from '../../../components/listings/ListingCard';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight } from '../../../constants/theme';

export default function ListingsScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { listings, loading } = useMyListings(user?.id);

  const canList = profile?.is_pacer || profile?.is_crew;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'My Listings',
          headerRight: () =>
            canList ? (
              <TouchableOpacity onPress={() => router.push('/(tabs)/listings/new')} style={styles.addBtn}>
                <Text style={styles.addBtnText}>+ New</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      {loading ? (
        <LoadingSpinner fullScreen />
      ) : !canList ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎽</Text>
          <Text style={styles.emptyTitle}>Become a pacer or crew</Text>
          <Text style={styles.emptyText}>
            Update your profile to add pacer or crew roles, then post your availability for races.
          </Text>
          <Button onPress={() => router.push('/(tabs)/profile')} variant="outline">
            Update Profile
          </Button>
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No listings yet</Text>
          <Text style={styles.emptyText}>Post your availability for a race to start getting bookings.</Text>
          <Button onPress={() => router.push('/(tabs)/listings/new')}>Create First Listing</Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              showStatus
              onPress={() => router.push(`/(tabs)/listings/${listing.id}`)}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  addBtn: { paddingHorizontal: Spacing.md },
  addBtnText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.semibold, color: Colors.text },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
