import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>MULE</Text>
          <Text style={styles.tagline}>Find your pack.{'\n'}Run your race.</Text>
          <Text style={styles.sub}>
            Connect with experienced pacers and crew for your next ultra.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => router.push('/(auth)/sign-up')} size="lg" fullWidth>
            Get Started
          </Button>
          <Button
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
            size="lg"
            fullWidth
          >
            Sign In
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.secondary },
  container: { flex: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  logo: {
    fontSize: 56,
    fontWeight: FontWeight.heavy,
    color: Colors.primary,
    letterSpacing: 8,
  },
  tagline: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    lineHeight: 40,
  },
  sub: {
    fontSize: FontSize.lg,
    color: Colors.textMuted,
    lineHeight: 26,
  },
  actions: { gap: Spacing.md },
});
