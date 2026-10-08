import React from 'react';
import { TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { radius, elevation } from '../../theme/spacing';

export interface CardProps {
  variant?: 'default' | 'hero';
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
}

export function Card({
  variant = 'default',
  children,
  onPress,
  style,
  noPadding = false,
}: CardProps) {
  const { colors, isDark } = useTheme();

  const containerStyle: StyleProp<ViewStyle> = [
    { backgroundColor: colors.cardBackground, overflow: 'hidden' },
    !noPadding && { padding: 16 },
    variant === 'hero'
      ? {
          borderTopLeftRadius: radius.leaf.topLeft,
          borderTopRightRadius: radius.leaf.topRight,
          borderBottomRightRadius: radius.leaf.bottomRight,
          borderBottomLeftRadius: radius.leaf.bottomLeft,
        }
      : { borderRadius: radius.lg },
    isDark ? { borderWidth: 1, borderColor: colors.border } : elevation.md,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={containerStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}
