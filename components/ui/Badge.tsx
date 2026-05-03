import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'pacer' | 'crew';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: Colors.backgroundDark, text: Colors.textSecondary },
  success: { bg: '#E8F8ED', text: Colors.success },
  warning: { bg: '#FFF3E0', text: Colors.warning },
  error: { bg: '#FFEBEE', text: Colors.error },
  info: { bg: '#E3F2FD', text: '#1976D2' },
  pacer: { bg: '#FFF3E0', text: Colors.primary },
  crew: { bg: '#E8F0FE', text: '#1565C0' },
};

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const colors = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
