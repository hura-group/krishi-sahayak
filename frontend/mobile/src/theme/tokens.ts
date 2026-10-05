export const tokens = {
  colors: {
    primary: '#2e7d32',        // Krishi Sahayak Brand Green
    primaryLight: '#e8f5e9',   // Surface Accent
    primaryDark: '#052e16',    // Dark Forest Green
    secondary: '#f59e0b',      // Amber
    background: '#f9fafb',
    cardBackground: '#ffffff',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#22c55e',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },
  typography: {
    header: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    title: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
    body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};