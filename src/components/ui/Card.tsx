import React from 'react';
import { ViewStyle, StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { NeomorphicSurface } from './NeomorphicSurface';

export type CardVariant = 'flat' | 'outlined' | 'elevated';

export interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'outlined',
  style,
  onPress,
  accessibilityLabel,
  padding,
}) => {
  const { colors, spacing } = useTheme();
  const pad = padding !== undefined ? padding : spacing.lg;

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const backgroundColor =
    variant === 'flat'
      ? colors.bgSecondary
      : variant === 'elevated'
        ? colors.bgElevated
        : colors.bgCard;

  return (
    <NeomorphicSurface
      variant={variant === 'flat' ? 'flat' : 'raised'}
      padding={pad}
      onPress={onPress ? handlePress : undefined}
      accessibilityLabel={accessibilityLabel}
      style={[{ backgroundColor }, style]}
    >
      {children}
    </NeomorphicSurface>
  );
};
