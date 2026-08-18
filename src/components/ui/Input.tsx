import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Eye, EyeOff, XCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorText?: string;
  isPassword?: boolean;
  clearable?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorText,
  isPassword = false,
  clearable = false,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  value,
  onChangeText,
  placeholder,
  editable = true,
  ...restProps
}) => {
  const { colors, accent, radius, spacing, typography } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  const hasError = !!errorText;

  const borderColor = hasError
    ? colors.danger
    : isFocused
    ? accent.primary
    : colors.borderSubtle;

  const handleClear = () => {
    if (onChangeText) {
      onChangeText('');
    }
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: hasError ? colors.danger : colors.textSecondary,
              fontSize: typography.sm,
              marginBottom: spacing.xs,
            },
            labelStyle,
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: editable ? colors.bgInput : colors.bgSecondary,
            borderColor,
            borderRadius: radius.md,
            minHeight: spacing.minTouchTarget,
          },
        ]}
      >
        {leftIcon && <View style={[styles.iconLeft, { paddingLeft: spacing.md }]}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontSize: typography.base,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
            inputStyle,
          ]}
          {...restProps}
        />

        {clearable && !!value && (
          <TouchableOpacity
            onPress={handleClear}
            style={[styles.actionButton, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
          >
            <XCircle size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={[styles.actionButton, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && !isPassword && !clearable && (
          <View style={[styles.iconRight, { paddingRight: spacing.md }]}>{rightIcon}</View>
        )}
      </View>

      {hasError ? (
        <Text
          style={[
            styles.helper,
            {
              color: colors.danger,
              fontSize: typography.xs,
              marginTop: spacing.xxs,
            },
          ]}
        >
          {errorText}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.helper,
            {
              color: colors.textTertiary,
              fontSize: typography.xs,
              marginTop: spacing.xxs,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    height: '100%',
  },
  iconLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  helper: {
    paddingHorizontal: 2,
  },
});
