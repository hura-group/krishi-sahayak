import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { tokens } from '@/theme/tokens';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borderRadius.full,
    alignSelf: 'flex-start',
  },
  info: { backgroundColor: tokens.colors.primaryLight },
  success: { backgroundColor: '#dcfce7' },
  warning: { backgroundColor: '#fef3c7' },
  error: { backgroundColor: '#fee2e2' },
  text: { ...tokens.typography.caption, fontWeight: '600' },
  infoText: { color: tokens.colors.primary },
  successText: { color: tokens.colors.success },
  warningText: { color: tokens.colors.secondary },
  errorText: { color: tokens.colors.error },
});