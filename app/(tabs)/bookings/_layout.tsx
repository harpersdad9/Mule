import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function BookingsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: Colors.background }, headerTintColor: Colors.primary, headerShadowVisible: false }} />
  );
}
