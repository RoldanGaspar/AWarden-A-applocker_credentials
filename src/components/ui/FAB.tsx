import React from 'react';
import {
  Platform,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import { AnimatedPressable } from './AnimatedPressable';

export interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
  label?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
}

type WebFabStyle = ViewStyle & {
  boxShadow?: string;
};

const FLOATING_TAB_BAR_HEIGHT = 70;
const FLOATING_TAB_BAR_GAP = 12;

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon,
  label,
  style,
  labelStyle,
  accessibilityLabel = 'Quick Add Action',
}) => {
  const { accent, colors, radius, spacing, typography } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  const isExtended = !!label;
  const bottomOffset =
    Math.max(insets.bottom, spacing.sm) + FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_GAP;
  const shadowStyle: WebFabStyle =
    Platform.OS === 'web'
      ? {
          boxShadow: `8px 10px 18px ${colors.surfaceShadow}, -5px -5px 12px ${colors.surfaceHighlight}`,
        }
      : {
          shadowColor: colors.surfaceShadow,
          shadowOffset: { width: 5, height: 7 },
          shadowOpacity: 0.3,
          shadowRadius: 11,
          elevation: 10,
        };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        styles.fab,
        {
          backgroundColor: colors.bgCard,
          borderRadius: isExtended ? radius.xl : radius.full,
          borderTopColor: colors.surfaceHighlight,
          borderLeftColor: colors.surfaceHighlight,
          borderRightColor: colors.surfaceShadow,
          borderBottomColor: colors.surfaceShadow,
          bottom: bottomOffset,
          paddingHorizontal: isExtended ? spacing.sm : 0,
        },
        shadowStyle,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens the add menu"
    >
      <View style={styles.contentRow}>
        <View
          style={[
            styles.fabCore,
            {
              backgroundColor: accent.primary,
              borderColor: accent.primaryHover,
            },
          ]}
        >
          {icon || <Plus size={26} color={accent.contrastText} strokeWidth={2.7} />}
        </View>
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: accent.primary,
                fontSize: typography.base,
                marginLeft: spacing.sm,
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    minHeight: 64,
    minWidth: 64,
    paddingVertical: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  fabCore: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
});
