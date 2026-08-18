import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface FABProps {
  onPress: () => void;
  icon?: React.ReactNode;
  label?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const FAB: React.FC<FABProps> = ({
  onPress,
  icon,
  label,
  style,
  labelStyle,
  accessibilityLabel = 'Quick Add Action',
}) => {
  const { accent, radius, shadows, spacing, typography } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onPress();
  };

  const isExtended = !!label;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.fab,
        {
          backgroundColor: accent.primary,
          borderRadius: isExtended ? radius.xl : radius.full,
          paddingHorizontal: isExtended ? spacing.lg : spacing.md,
          ...shadows.elevated,
        },
        style,
      ]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.contentRow}>
        {icon || <Plus size={24} color="#FFFFFF" />}
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: '#FFFFFF',
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    minHeight: 56,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
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
