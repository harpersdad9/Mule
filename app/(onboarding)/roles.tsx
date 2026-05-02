import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants/theme';

interface RoleOption {
  id: 'runner' | 'pacer' | 'crew';
  title: string;
  description: string;
  emoji: string;
}

const ROLES: RoleOption[] = [
  { id: 'runner', title: 'Runner', description: 'Find pacers and crew for your next ultra', emoji: '🏃' },
  { id: 'pacer', title: 'Pacer', description: 'Help runners through their race and earn money', emoji: '💨' },
  { id: 'crew', title: 'Crew', description: 'Support runners at aid stations and checkpoints', emoji: '🎽' },
];

export default function RolesScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<Set<'runner' | 'pacer' | 'crew'>>(new Set(['runner']));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  function toggleRole(role: 'runner' | 'pacer' | 'crew') {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        if (next.size === 1) return prev;
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  }

  async function handleContinue() {
    if (!user) return;
    setLoading(true);
    // @ts-expect-error supabase-js v2 Database generic incompatibility with hand-written types
    const { error } = await supabase.from('profiles').update({
      is_runner: selected.has('runner'),
      is_pacer: selected.has('pacer'),
      is_crew: selected.has('crew'),
    }).eq('id', user.id);
    setLoading(false);
    if (error) { setFormError(error.message); return; }
    await refreshProfile();
    router.push('/(onboarding)/strava-connect');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>What's your role?</Text>
        <Text style={styles.subtitle}>You can hold multiple roles — select all that apply.</Text>

        {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}
        <View style={styles.roles}>
          {ROLES.map((role) => {
            const active = selected.has(role.id);
            return (
              <TouchableOpacity
                key={role.id}
                style={[styles.roleCard, active && styles.roleCardActive]}
                onPress={() => toggleRole(role.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.emoji}>{role.emoji}</Text>
                <View style={styles.roleText}>
                  <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{role.title}</Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </View>
                <View style={[styles.check, active && styles.checkActive]}>
                  {active && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Button onPress={handleContinue} loading={loading} fullWidth size="lg">
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: -Spacing.md },
  roles: { flex: 1, gap: Spacing.md },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F1' },
  errorBanner: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.sm, backgroundColor: '#fee2e2', borderRadius: 8 },
  emoji: { fontSize: 32 },
  roleText: { flex: 1 },
  roleTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.text },
  roleTitleActive: { color: Colors.primary },
  roleDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkMark: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
