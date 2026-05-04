import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Colors, FontSize } from '../constants/theme';

// Completes the auth session when Google redirects back to this route.
WebBrowser.maybeCompleteAuthSession();

export default function GoogleCallbackScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Connecting Google Calendar…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: Colors.background },
  text: { fontSize: FontSize.md, color: Colors.textSecondary },
});
