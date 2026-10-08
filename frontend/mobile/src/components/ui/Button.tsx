import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radius, touchTarget } from '../../theme/spacing';
import { typeScale } from '../../theme/typography';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  disabled = false,
  style,
  labelStyle,
  fullWidth = false,
  onPress,
  ...rest
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const containerStyle = StyleSheet.flatten([
    styles.base,
    size === 'sm' ? styles.sm : styles.md,
    fullWidth && styles.fullWidth,
    variant === 'primary' && {
      backgroundColor: isDisabled ? colors.border : colors.primary,
    },
    variant === 'secondary' && {
      backgroundColor: 'transparent',
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    variant === 'ghost' && {
      backgroundColor: 'transparent',
    },
    style,
  ]);

  const resolvedLabelColor = variant === 'primary' ? '#ffffff' : colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={containerStyle}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={resolvedLabelColor} />
      ) : (
        <Text style={[styles.label, { color: resolvedLabelColor }, labelStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  md: { height: touchTarget.button },
  sm: { height: touchTarget.min, paddingHorizontal: 16 },
  fullWidth: { alignSelf: 'stretch' },
  label: {
    fontSize: typeScale.button.fontSize,
    fontWeight: typeScale.button.fontWeight,
  },
});
