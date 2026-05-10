import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../../lib/auth';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight } from '../../../constants/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Soft delete — contact support flow for now
            Alert.alert('Contact Support', 'To delete your account, please email support@mule.run');
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: true, headerTitle: 'Settings', headerBackTitle: 'Profile' }} />
      <View style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <Text style={styles.link}>Privacy Policy</Text>
          <Text style={styles.link}>Terms of Service</Text>
        </View>

        <View style={styles.section}>
          <Button onPress={signOut} variant="outline" fullWidth>Sign Out</Button>
          <Button onPress={handleDeleteAccount} variant="danger" fullWidth style={styles.deleteBtn}>
            Delete Account
          </Button>
        </View>

        <Text style={styles.version}>Mule v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, gap: Spacing.xl },
  section: { gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  email: { fontSize: FontSize.md, color: Colors.text },
  link: { fontSize: FontSize.md, color: Colors.primary },
  deleteBtn: { marginTop: Spacing.sm },
  version: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', marginTop: 'auto' },
});
