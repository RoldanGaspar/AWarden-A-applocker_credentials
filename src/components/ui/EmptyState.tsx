import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}) => {
  const { colors, spacing, typography, radius } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.xl }, style]}>
      <View
        style={[
          styles.iconBox,
          { backgroundColor: colors.bgSecondary, borderRadius: radius.xl, marginBottom: spacing.md },
        ]}
      >
        {icon}
      </View>
      <Text
        style={[
          styles.title,
          { color: colors.textPrimary, fontSize: typography.base, marginBottom: spacing.xs },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          { color: colors.textTertiary, fontSize: typography.sm, marginBottom: actionTitle ? spacing.md : 0 },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onActionPress && (
        <Button title={actionTitle} onPress={onActionPress} variant="outline" size="sm" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});
