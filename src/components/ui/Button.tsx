import React from 'react';
import {
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  iconLeft,
  iconRight,
  style,
  textStyle,
  fullWidth = false,
  accessibilityLabel,
  hapticFeedback = true,
}) => {
  const { colors, accent, radius, spacing, typography } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    const minHeight = size === 'sm' ? 44 : size === 'lg' ? 56 : 48;
    const paddingHorizontal = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xxl : spacing.lg;

    let backgroundColor: string = accent.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    switch (variant) {
      case 'primary':
        backgroundColor = disabled ? colors.borderStrong : accent.primary;
        break;
      case 'secondary':
        backgroundColor = disabled ? colors.bgSecondary : colors.bgTertiary;
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderColor = disabled ? colors.borderSubtle : accent.primary;
        borderWidth = 1.5;
        break;
      case 'danger':
        backgroundColor = disabled ? colors.borderStrong : colors.danger;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
    }

    return {
      minHeight,
      paddingHorizontal,
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.6 : 1,
      width: fullWidth ? '100%' : undefined,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color = accent.contrastText;

    switch (variant) {
      case 'primary':
      case 'danger':
        color = '#FFFFFF';
        break;
      case 'secondary':
        color = colors.textPrimary;
        break;
      case 'outline':
      case 'ghost':
        color = disabled ? colors.textMuted : accent.primary;
        break;
    }

    const fontSize =
      size === 'sm' ? typography.sm : size === 'lg' ? typography.md : typography.base;

    return {
      color,
      fontSize,
      fontWeight: '600',
      letterSpacing: 0.2,
      textAlign: 'center',
    };
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : accent.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
