import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: false,
        headerTitle: '',
        headerStyle: { backgroundColor: Colors.background },
        headerShadowVisible: false,
      }}
    />
  );
}
