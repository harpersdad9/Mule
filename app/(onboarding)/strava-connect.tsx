import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../components/ui/Button';
import { useStravaSync } from '../../hooks/useStravaSync';
import { Colors, Spacing, FontSize, FontWeight } from '../../constants/theme';

export default function StravaConnectScreen() {
  const router = useRouter();
  const { connect, connecting, error } = useStravaSync();

  async function handleConnect() {
    const { success } = await connect();
    if (success) {
      router.push('/(onboarding)/build-profile');
    } else if (error) {
      Alert.alert('Strava Error', error);
    }
  }

  function handleSkip() {
    router.push('/(onboarding)/build-profile');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.stravaIcon}>
            <Text style={styles.stravaLetter}>S</Text>
          </View>
          <Text style={styles.title}>Connect Strava</Text>
          <Text style={styles.subtitle}>
            Link your Strava account to automatically show your running stats on your profile.
            Pacers with verified mileage get more bookings.
          </Text>
          <View style={styles.benefits}>
            {[
              'Auto-populate total mileage and elevation',
              'Display your longest run and this year\'s distance',
              'Build trust with verified running history',
            ].map((benefit, i) => (
              <View key={i} style={styles.benefit}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <Button onPress={handleConnect} loading={connecting} fullWidth size="lg" style={styles.stravaBtn}>
            Connect with Strava
          </Button>
          <Button onPress={handleSkip} variant="ghost" fullWidth>
            Skip for now
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', gap: Spacing.lg },
  stravaIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.stravaOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stravaLetter: { fontSize: 36, fontWeight: FontWeight.heavy, color: Colors.white },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24 },
  benefits: { gap: Spacing.sm },
  benefit: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  bullet: { fontSize: FontSize.md, color: Colors.success, fontWeight: FontWeight.bold, marginTop: 1 },
  benefitText: { fontSize: FontSize.md, color: Colors.text, flex: 1, lineHeight: 22 },
  actions: { gap: Spacing.md },
  stravaBtn: { backgroundColor: Colors.stravaOrange },
});
