import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  destructive?: boolean;
  disabled?: boolean;
  borderBottom?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leftIcon,
  rightElement,
  showChevron = false,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
  destructive = false,
  disabled = false,
  borderBottom = true,
}) => {
  const { colors, spacing, typography } = useTheme();

  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  const isInteractive = !!onPress && !disabled;

  const content = (
    <View
      style={[
        styles.row,
        {
          minHeight: spacing.minTouchTarget + 8,
          paddingVertical: spacing.md,
          borderBottomWidth: borderBottom ? 1 : 0,
          borderBottomColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {leftIcon && <View style={[styles.leftIcon, { marginRight: spacing.md }]}>{leftIcon}</View>}

      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            {
              color: destructive
                ? colors.danger
                : disabled
                ? colors.textMuted
                : colors.textPrimary,
              fontSize: typography.base,
            },
            titleStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: disabled ? colors.textMuted : colors.textTertiary,
                fontSize: typography.sm,
                marginTop: spacing.xxs,
              },
              subtitleStyle,
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      <View style={styles.rightContainer}>
        {rightElement}
        {showChevron && (
          <ChevronRight
            size={18}
            color={colors.textMuted}
            style={{ marginLeft: rightElement ? spacing.xs : 0 }}
          />
        )}
      </View>
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leftIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '500',
  },
  subtitle: {},
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
});
