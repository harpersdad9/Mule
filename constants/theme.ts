export const Colors = {
  primary: '#FF6B35',      // Orange — energy, trails
  primaryDark: '#D94F1A',
  secondary: '#1a1a2e',    // Deep navy
  secondaryLight: '#2d2d44',
  accent: '#4CAF50',       // Green — nature, completion
  background: '#F7F5F2',   // Warm off-white
  backgroundDark: '#EDEBE8',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EEE9',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  textMuted: '#AEAEB2',
  border: '#D1CFC9',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  white: '#FFFFFF',
  black: '#000000',
  starFilled: '#FF9500',
  starEmpty: '#D1CFC9',
  stravaOrange: '#FC4C02',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 6,
  },
};
