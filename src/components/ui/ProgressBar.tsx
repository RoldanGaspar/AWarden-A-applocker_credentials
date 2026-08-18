import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

export interface ProgressBarProps {
  progress: number; // 0.0 to 1.0 (or higher for over budget)
  status?: 'default' | 'success' | 'warning' | 'danger';
  height?: number;
  style?: ViewStyle;
  trackColor?: string;
  fillColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  status = 'default',
  height = 8,
  style,
  trackColor,
  fillColor,
}) => {
  const { colors, accent, radius } = useTheme();

  // Clamp percentage between 0 and 100 for width
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const percentage = `${Math.round(clampedProgress * 100)}%` as const;

  const getFillColor = (): string => {
    if (fillColor) return fillColor;
    switch (status) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      default:
        return accent.primary;
    }
  };

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: trackColor || colors.bgTertiary,
          borderRadius: radius.full,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress * 100) }}
    >
      <View
        style={[
          styles.fill,
          {
            width: percentage,
            backgroundColor: getFillColor(),
            borderRadius: radius.full,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
