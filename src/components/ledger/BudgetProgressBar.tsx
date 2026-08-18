/**
 * Life OS & Vault - Budget Progress Bar Component
 * Displays spending progress against monthly category limit with dynamic color coding
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { ProgressBar, Tag } from '../ui';
import { renderCategoryIconHelper } from './CategoryManagerModal';
import { BudgetOverviewItem } from '../../types/models';

export interface BudgetProgressBarProps {
  item: BudgetOverviewItem;
  onPress?: (categoryId: string) => void;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  item,
  onPress,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const handlePress = () => {
    if (onPress) {
      Haptics.selectionAsync().catch(() => {});
      onPress(item.categoryId);
    }
  };

  const getStatusColor = () => {
    if (item.status === 'over') return colors.danger;
    if (item.status === 'warning') return colors.warning;
    return colors.success;
  };

  const getStatusBg = () => {
    if (item.status === 'over') return colors.dangerBg;
    if (item.status === 'warning') return colors.warningBg;
    return colors.successBg;
  };

  const progressFraction = Math.min(1, item.percentage / 100);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.borderSubtle,
          borderRadius: radius.md,
          padding: spacing.md,
          marginBottom: spacing.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Budget for ${item.categoryName}: ₱${item.spent.toLocaleString()} of ₱${item.limit.toLocaleString()} spent, ${Math.round(item.percentage)}%`}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleInfo}>
          <View style={[styles.iconBox, { backgroundColor: item.categoryColor, borderRadius: radius.xs }]}>
            {renderCategoryIconHelper(item.categoryIcon, '#FFFFFF', 14)}
          </View>
          <Text style={[styles.categoryName, { color: colors.textPrimary, fontSize: typography.sm }]}>
            {item.categoryName}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBg(), borderColor: getStatusColor(), borderRadius: radius.full },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(), fontSize: 10 }]}>
            {Math.round(item.percentage)}% {item.status === 'over' ? 'OVER' : ''}
          </Text>
        </View>
      </View>

      <ProgressBar
        progress={progressFraction}
        status={item.status === 'over' ? 'danger' : item.status === 'warning' ? 'warning' : 'success'}
        height={7}
        style={{ marginVertical: 8 }}
      />

      <View style={styles.footerRow}>
        <Text style={[styles.amountText, { color: colors.textSecondary, fontSize: typography.xs }]}>
          Spent: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>₱{item.spent.toLocaleString()}</Text>
        </Text>
        <Text style={[styles.limitText, { color: colors.textTertiary, fontSize: typography.xs }]}>
          Limit: ₱{item.limit.toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  statusText: {
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountText: {},
  limitText: {},
});
