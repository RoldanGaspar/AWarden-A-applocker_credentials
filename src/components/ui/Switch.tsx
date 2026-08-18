import React from 'react';
import {
  Switch as RNSwitch,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  subtitle?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  label,
  subtitle,
  disabled = false,
  style,
}) => {
  const { colors, accent, spacing, typography } = useTheme();

  const handleToggle = (newValue: boolean) => {
    if (disabled) return;
    Haptics.selectionAsync().catch(() => {});
    onValueChange(newValue);
  };

  const trackColor = {
    false: colors.bgTertiary,
    true: accent.primary,
  };

  const thumbColor = Platform.OS === 'android'
    ? value
      ? '#FFFFFF'
      : colors.textMuted
    : '#FFFFFF';

  return (
    <View style={[styles.container, { minHeight: spacing.minTouchTarget }, style]}>
      {(label || subtitle) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text
              style={[
                styles.label,
                { color: disabled ? colors.textMuted : colors.textPrimary, fontSize: typography.base },
              ]}
            >
              {label}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: colors.textTertiary, fontSize: typography.sm, marginTop: spacing.xxs },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}

      <RNSwitch
        value={value}
        onValueChange={handleToggle}
        disabled={disabled}
        trackColor={trackColor}
        thumbColor={thumbColor}
        ios_backgroundColor={colors.bgTertiary}
        accessibilityRole="switch"
        accessibilityLabel={label}
        accessibilityState={{ checked: value, disabled }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  labelContainer: {
    flex: 1,
    paddingRight: 16,
  },
  label: {
    fontWeight: '500',
  },
  subtitle: {},
});
