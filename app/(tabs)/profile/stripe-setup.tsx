import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { createConnectAccount } from '../../../lib/stripe';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Colors, Spacing, FontSize, FontWeight } from '../../../constants/theme';
import type { Database } from '../../../types/database.types';

type StripeAccount = Database['public']['Tables']['stripe_accounts']['Row'];

export default function StripeSetupScreen() {
  const { user } = useAuth();
  const [account, setAccount] = useState<StripeAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('stripe_accounts').select('*').eq('user_id', user.id).single()
      .then(({ data }) => { setAccount(data ?? null); setLoading(false); });
  }, [user]);

  async function handleSetup() {
    setConnecting(true);
    const returnUrl = Linking.createURL('stripe-return');
    const refreshUrl = Linking.createURL('stripe-refresh');
    const { onboardingUrl, error } = await createConnectAccount(returnUrl, refreshUrl);
    if (error || !onboardingUrl) {
      Alert.alert('Error', error ?? 'Could not start setup. Please try again.');
      setConnecting(false);
      return;
    }
    await WebBrowser.openAuthSessionAsync(onboardingUrl, returnUrl);
    // Refresh account status after returning
    if (user) {
      const { data } = await supabase.from('stripe_accounts').select('*').eq('user_id', user.id).single();
      setAccount(data ?? null);
    }
    setConnecting(false);
  }

  if (loading) return <LoadingSpinner fullScreen />;

  const ready = account?.charges_enabled && account?.payouts_enabled;

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Payouts', headerBackTitle: 'Profile' }} />
      <View style={styles.container}>
        <Text style={styles.title}>Payout Setup</Text>
        <Text style={styles.subtitle}>
          Set up your Stripe account to receive payments for your pacer and crew bookings.
          Mule takes a 5% platform fee — you keep the rest.
        </Text>

        {account ? (
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Charges</Text>
              <Badge label={account.charges_enabled ? 'Enabled' : 'Pending'} variant={account.charges_enabled ? 'success' : 'warning'} />
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Payouts</Text>
              <Badge label={account.payouts_enabled ? 'Enabled' : 'Pending'} variant={account.payouts_enabled ? 'success' : 'warning'} />
            </View>
            {!ready && (
              <Button onPress={handleSetup} loading={connecting} variant="outline" fullWidth>
                Continue Setup
              </Button>
            )}
            {ready && (
              <Text style={styles.readyText}>Your account is fully set up. You'll receive payouts after completed races.</Text>
            )}
          </View>
        ) : (
          <Button onPress={handleSetup} loading={connecting} fullWidth size="lg">
            Set Up Payouts
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, gap: Spacing.xl, justifyContent: 'center' },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  statusSection: { gap: Spacing.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm },
  statusLabel: { fontSize: FontSize.md, color: Colors.text },
  readyText: { fontSize: FontSize.md, color: Colors.success, textAlign: 'center', lineHeight: 24 },
});
