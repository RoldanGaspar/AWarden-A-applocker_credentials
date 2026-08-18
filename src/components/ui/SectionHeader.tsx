import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText = 'See all',
  onActionPress,
  icon,
  style,
  accessibilityLabel,
}) => {
  const { colors, accent, spacing, typography } = useTheme();

  const handleAction = () => {
    if (onActionPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onActionPress();
    }
  };

  return (
    <View style={[styles.container, { marginBottom: spacing.sm, marginTop: spacing.md }, style]}>
      <View style={styles.left}>
        {icon && <View style={[styles.iconWrapper, { marginRight: spacing.xs }]}>{icon}</View>}
        <View>
          <Text
            style={[styles.title, { color: colors.textPrimary, fontSize: typography.base }]}
            accessibilityRole="header"
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textTertiary, fontSize: typography.xs }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {onActionPress && (
        <TouchableOpacity
          onPress={handleAction}
          style={[styles.actionButton, { minHeight: spacing.minTouchTarget }]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || `${actionText} for ${title}`}
        >
          <Text style={[styles.actionText, { color: accent.primary, fontSize: typography.sm }]}>
            {actionText}
          </Text>
          <ChevronRight size={16} color={accent.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  actionText: {
    fontWeight: '600',
  },
});
