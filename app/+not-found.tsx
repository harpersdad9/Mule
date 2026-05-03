import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, FontSize } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View style={styles.container}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Lost on the trail?</Text>
        <Link href="/(tabs)/search" style={styles.link}>Head back to search</Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, backgroundColor: Colors.background },
  emoji: { fontSize: 64 },
  title: { fontSize: FontSize.xl, color: Colors.text },
  link: { fontSize: FontSize.md, color: Colors.primary },
});
