import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { useProfile } from '../../../hooks/useProfile';
import { useStravaSync } from '../../../hooks/useStravaSync';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { StravaStatsBlock } from '../../../components/profiles/StravaStatsBlock';
import { StarRating } from '../../../components/ui/StarRating';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../../constants/theme';

const ROLES = [
  { id: 'runner' as const, label: 'Runner', emoji: '🏃' },
  { id: 'pacer' as const, label: 'Pacer', emoji: '💨' },
  { id: 'crew' as const, label: 'Crew', emoji: '🎽' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, refreshProfile } = useAuth();
  const { profile, strava, avgRating, reviewCount, loading, updateProfile } = useProfile(user?.id);
  const { sync, syncing } = useStravaSync();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesError, setRolesError] = useState('');

  function startEdit() {
    setBio(profile?.bio ?? '');
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    const { error } = await updateProfile({ bio: bio.trim() || null });
    setSaving(false);
    if (error) setRolesError(error);
    else setEditing(false);
  }

  async function toggleRole(role: 'runner' | 'pacer' | 'crew') {
    if (!profile) return;
    const currentVal = profile[`is_${role}` as 'is_runner' | 'is_pacer' | 'is_crew'];
    const isLast = [profile.is_runner, profile.is_pacer, profile.is_crew].filter(Boolean).length === 1;
    if (currentVal && isLast) return; // keep at least one role
    setRolesSaving(true);
    setRolesError('');
    const { error } = await updateProfile({ [`is_${role}`]: !currentVal });
    if (!error) await refreshProfile();
    else setRolesError(error);
    setRolesSaving(false);
  }

  async function handleStravaSync() {
    const { success } = await sync();
    if (!success) setRolesError('Could not sync Strava stats. Please try again.');
  }

  if (loading) return <LoadingSpinner fullScreen />;
  if (!profile) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'My Profile',
          headerRight: () => (
            <Button onPress={() => router.push('/(tabs)/profile/settings')} variant="ghost" size="sm">
              Settings
            </Button>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Avatar uri={profile.avatar_url} name={profile.full_name} size={80} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{profile.full_name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            {reviewCount > 0 && (
              <View style={styles.ratingRow}>
                <StarRating rating={Math.round(avgRating ?? 0)} size={14} />
                <Text style={styles.ratingText}>{(avgRating ?? 0).toFixed(1)} ({reviewCount})</Text>
              </View>
            )}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>My Roles</Text>
          <View style={styles.rolesRow}>
            {ROLES.map((role) => {
              const active = !!profile[`is_${role.id}` as 'is_runner' | 'is_pacer' | 'is_crew'];
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[styles.roleChip, active && styles.roleChipActive]}
                  onPress={() => toggleRole(role.id)}
                  disabled={rolesSaving}
                  activeOpacity={0.75}
                >
                  <Text style={styles.roleEmoji}>{role.emoji}</Text>
                  <Text style={[styles.roleLabel, active && styles.roleLabelActive]}>{role.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {rolesError ? <Text style={styles.errorText}>{rolesError}</Text> : null}
        </View>

        {editing ? (
          <View style={styles.editBio}>
            <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} style={styles.bioInput} />
            <View style={styles.editBtns}>
              <Button onPress={() => setEditing(false)} variant="outline" style={styles.editBtn}>Cancel</Button>
              <Button onPress={saveEdit} loading={saving} style={styles.editBtn}>Save</Button>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.bio}>{profile.bio ?? 'No bio yet.'}</Text>
            <Button onPress={startEdit} variant="ghost" size="sm" style={styles.editBioBtn}>Edit Bio</Button>
          </View>
        )}

        {strava ? (
          <View style={styles.stravaSection}>
            <StravaStatsBlock
              stats={{
                total_distance_km: strava.total_distance_km,
                total_elevation_m: strava.total_elevation_m,
                ytd_distance_km: strava.ytd_distance_km,
                longest_run_km: strava.longest_run_km,
                race_count: strava.race_count,
                last_synced_at: strava.last_synced_at,
              }}
            />
            <Button onPress={handleStravaSync} loading={syncing} variant="outline" size="sm">
              Sync Strava
            </Button>
          </View>
        ) : (
          <Button onPress={() => router.push('/(onboarding)/strava-connect')} variant="outline" style={styles.stravaBtn}>
            Connect Strava
          </Button>
        )}

        {(profile.is_pacer || profile.is_crew) && (
          <Button onPress={() => router.push('/(tabs)/profile/stripe-setup')} variant="outline">
            Manage Payouts
          </Button>
        )}

        <Button onPress={signOut} variant="ghost" style={styles.signOutBtn}>
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { flexDirection: 'row', gap: Spacing.lg, alignItems: 'flex-start' },
  headerInfo: { flex: 1, gap: Spacing.xs },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  username: { fontSize: FontSize.md, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  ratingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sectionLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm },
  rolesRow: { flexDirection: 'row', gap: Spacing.sm },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  roleEmoji: { fontSize: 16 },
  roleLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  roleLabelActive: { color: Colors.primary },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: Spacing.xs },
  bio: { fontSize: FontSize.md, color: Colors.text, lineHeight: 24 },
  editBioBtn: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  editBio: { gap: Spacing.md },
  bioInput: { height: 80 },
  editBtns: { flexDirection: 'row', gap: Spacing.md },
  editBtn: { flex: 1 },
  stravaSection: { gap: Spacing.sm },
  stravaBtn: { borderColor: Colors.stravaOrange },
  signOutBtn: { marginTop: Spacing.lg },
});
