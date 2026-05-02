import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  async function handleSignIn() {
    if (!email || !password) return;
    setFormError('');
    setLoading(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) setFormError(error.message);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your Mule account</Text>

        <View style={styles.form}>
          {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
          />
          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotRow}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
          <Button onPress={handleSignIn} loading={loading} fullWidth size="lg">
            Sign In
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'center', gap: Spacing.lg },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: -Spacing.sm },
  form: { gap: Spacing.md },
  forgotRow: { alignSelf: 'flex-end', marginTop: -Spacing.sm },
  errorBanner: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.sm, backgroundColor: '#fee2e2', borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  link: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
});
