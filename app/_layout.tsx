import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../lib/auth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function RootNavigator() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && !profile?.onboarding_done && !inOnboarding && !inAuthGroup) {
      router.replace('/(onboarding)/roles');
    } else if (session && profile?.onboarding_done && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)/search');
    }
  }, [session, profile, loading, segments]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="review/[bookingId]" options={{ presentation: 'modal', headerShown: true, title: 'Write a Review' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </AuthProvider>
  );
}
