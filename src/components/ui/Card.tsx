import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

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
  const { colors, radius, shadows, spacing } = useTheme();

  const pad = padding !== undefined ? padding : spacing.lg;

  const getContainerStyle = (): ViewStyle => {
    let backgroundColor = colors.bgCard;
    let borderColor = colors.borderSubtle;
    let borderWidth = 0;
    let shadowStyle = shadows.none;

    switch (variant) {
      case 'flat':
        backgroundColor = colors.bgSecondary;
        break;
      case 'outlined':
        backgroundColor = colors.bgCard;
        borderColor = colors.borderSubtle;
        borderWidth = 1;
        break;
      case 'elevated':
        backgroundColor = colors.bgElevated;
        shadowStyle = shadows.card;
        break;
    }

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius: radius.lg,
      padding: pad,
      ...shadowStyle,
    };
  };

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[getContainerStyle(), style]}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[getContainerStyle(), style]}>{children}</View>;
};
