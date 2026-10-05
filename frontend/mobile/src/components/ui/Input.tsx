import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { tokens } from '@/theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  prefix?: string;
  suffix?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  prefix,
  suffix,
  style,
  ...rest
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, !!error && styles.inputError]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={tokens.colors.textSecondary}
          {...rest}
        />
        {suffix && <Text style={styles.suffix}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.sm,
  },
  label: {
    ...tokens.typography.caption,
    fontWeight: '600',
    color: tokens.colors.textSecondary,
    marginBottom: tokens.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.cardBackground,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.borderRadius.md,
    paddingHorizontal: tokens.spacing.md,
    height: 48,
  },
  inputError: {
    borderColor: tokens.colors.error,
  },
  input: {
    flex: 1,
    ...tokens.typography.body,
    color: tokens.colors.textPrimary,
  },
  prefix: {
    marginRight: tokens.spacing.xs,
    color: tokens.colors.textSecondary,
  },
  suffix: {
    marginLeft: tokens.spacing.xs,
    color: tokens.colors.textSecondary,
  },
  errorText: {
    ...tokens.typography.caption,
    color: tokens.colors.error,
    marginTop: 2,
  },
});