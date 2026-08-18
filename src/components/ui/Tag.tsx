import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';

export interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export const Tag: React.FC<TagProps> = ({
  label,
  selected = false,
  onPress,
  onRemove,
  color,
  icon,
  style,
  textStyle,
  size = 'md',
}) => {
  const { colors, accent, radius, spacing, typography, isDark } = useTheme();

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress();
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onRemove();
    }
  };

  const isInteractive = !!onPress;
  const tagColor = color || accent.primary;

  const bg = selected
    ? tagColor
    : isDark
    ? colors.bgTertiary
    : colors.bgSecondary;

  const textColor = selected
    ? '#FFFFFF'
    : color
    ? tagColor
    : colors.textSecondary;

  const padH = size === 'sm' ? spacing.sm : spacing.md;
  const padV = size === 'sm' ? spacing.xxs : spacing.xs;
  const fontSize = size === 'sm' ? typography.xs : typography.sm;

  const content = (
    <View style={styles.inner}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: textColor, fontSize }, textStyle]}>{label}</Text>
      {onRemove && (
        <TouchableOpacity
          onPress={handleRemove}
          style={styles.removeButton}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
        >
          <X size={12} color={textColor} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.container,
          {
            backgroundColor: bg,
            borderRadius: radius.full,
            paddingHorizontal: padH,
            paddingVertical: padV,
            borderColor: selected ? tagColor : colors.borderSubtle,
            borderWidth: 1,
            minHeight: 32,
          },
          style,
        ]}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderColor: selected ? tagColor : colors.borderSubtle,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 6,
    padding: 2,
  },
});
