import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        style={[styles.input, focused && styles.focused, error && styles.errored, style]}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={Colors.textMuted}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  focused: { borderColor: Colors.primary },
  errored: { borderColor: Colors.error },
  error: { fontSize: FontSize.sm, color: Colors.error },
});
