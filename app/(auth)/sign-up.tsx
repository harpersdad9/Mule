import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../lib/auth';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'Enter a valid email address';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSignUp() {
    if (!validate()) return;
    setFormError('');
    setLoading(true);
    const { error } = await signUp(email.trim().toLowerCase(), password);
    setLoading(false);
    if (error) {
      setFormError(error.message);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <Text style={styles.successTitle}>Check your email</Text>
          <Text style={styles.successText}>
            We sent a verification link to {email}. Click it to activate your account, then come back and sign in.
          </Text>
          <Button onPress={() => router.replace('/(auth)/sign-in')} fullWidth size="lg">
            Go to Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join the ultra running community</Text>

        <View style={styles.form}>
          {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            error={errors.password}
          />
          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            error={errors.confirm}
          />
          <Button onPress={handleSignUp} loading={loading} fullWidth size="lg" style={styles.cta}>
            Create Account
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
            <Text style={styles.link}>Sign In</Text>
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
  cta: { marginTop: Spacing.sm },
  errorBanner: { color: Colors.error, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.sm, backgroundColor: '#fee2e2', borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  footerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  link: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  successContainer: { flex: 1, padding: Spacing.xl, justifyContent: 'center', gap: Spacing.lg },
  successTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  successText: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
});
