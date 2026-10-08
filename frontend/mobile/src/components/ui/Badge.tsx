import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '../../theme/tokens';

export interface BadgeProps {
  label: string;
  variant?: 'warning' | 'success' | 'default';
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, variant = 'default', style }: BadgeProps) {
  const getBackgroundColor = () => {
    if (variant === 'warning') return '#fef3c7';
    if (variant === 'success') return tokens.colors.primaryLight;
    return tokens.colors.border;
  };

  const getTextColor = () => {
    if (variant === 'warning') return '#92400e';
    if (variant === 'success') return tokens.colors.primary;
    return tokens.colors.textPrimary;
  };

  return (
    <View style={[styles.badge, { backgroundColor: getBackgroundColor() }, style]}>
      <Text style={[styles.text, { color: getTextColor() }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
