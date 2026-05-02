import { Stack } from 'expo-router';
import { Colors } from '../../../constants/theme';

export default function InboxLayout() {
  return <Stack screenOptions={{ headerStyle: { backgroundColor: Colors.background }, headerShadowVisible: false }} />;
}
