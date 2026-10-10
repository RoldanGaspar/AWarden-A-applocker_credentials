import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

export type NeomorphicVariant = 'raised' | 'inset' | 'flat';

export interface NeomorphicSurfaceProps {
  children: React.ReactNode;
  variant?: NeomorphicVariant;
  style?: StyleProp<ViewStyle>;
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}

type WebSurfaceStyle = ViewStyle & {
  boxShadow?: string;
};

export const NeomorphicSurface: React.FC<NeomorphicSurfaceProps> = ({
  children,
  variant = 'raised',
  style,
  padding,
  onPress,
  accessibilityLabel,
}) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const isRaised = variant === 'raised';
  const isInset = variant === 'inset';

  const webShadow = isInset
    ? `inset 4px 4px 10px ${colors.surfaceShadow}, inset -4px -4px 10px ${colors.surfaceHighlight}`
    : isRaised
      ? `7px 7px 16px ${colors.surfaceShadow}, -7px -7px 16px ${colors.surfaceHighlight}`
      : 'none';

  const depthStyle: WebSurfaceStyle =
    Platform.OS === 'web'
      ? { boxShadow: webShadow }
      : {
          shadowColor: colors.surfaceShadow,
          shadowOffset: { width: isInset ? 2 : 6, height: isInset ? 2 : 6 },
          shadowOpacity: variant === 'flat' ? 0 : isDark ? 0.72 : 0.65,
          shadowRadius: isInset ? 5 : 12,
          elevation: variant === 'flat' ? 0 : isInset ? 2 : 5,
        };

  const borderStyle: ViewStyle =
    variant === 'flat'
      ? { borderWidth: 0 }
      : isInset
        ? {
            borderWidth: 1,
            borderTopColor: colors.surfaceShadow,
            borderLeftColor: colors.surfaceShadow,
            borderRightColor: colors.surfaceHighlight,
            borderBottomColor: colors.surfaceHighlight,
          }
        : {
            borderWidth: 1,
            borderTopColor: colors.surfaceHighlight,
            borderLeftColor: colors.surfaceHighlight,
            borderRightColor: colors.surfaceShadow,
            borderBottomColor: colors.surfaceShadow,
        };

  const surfaceStyle = StyleSheet.flatten([
    styles.base,
    {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: padding ?? spacing.lg,
    },
    borderStyle,
    depthStyle,
    style,
  ]) as WebSurfaceStyle;

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={surfaceStyle}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View style={surfaceStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    overflow: 'visible',
  },
});
