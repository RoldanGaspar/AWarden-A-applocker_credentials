/**
 * Life OS & Vault - Transaction Row Component
 * Displays category icon, payee, decrypted note snippet, formatted amount, recurring indicator, and actions
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Repeat,
  Copy,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { AnimatedPressable } from '../ui';
import { renderCategoryIconHelper } from './CategoryManagerModal';
import { Transaction } from '../../types/models';

export interface TransactionRowProps {
  transaction: Transaction;
  onPress: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  borderBottom?: boolean;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onPress,
  onEdit,
  onDuplicate,
  onDelete,
  borderBottom = true,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      transaction.payee_or_source || 'Transaction Options',
      `${transaction.type === 'income' ? '+' : '-'}${transaction.currency || 'PHP'} ${transaction.amount.toLocaleString()}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: onEdit },
        { text: 'Duplicate Transaction', onPress: onDuplicate },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const isIncome = transaction.type === 'income';
  const catColor = transaction.categoryColor || (isIncome ? colors.success : colors.danger);

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={handleLongPress}
      style={[
        styles.container,
        {
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: borderBottom ? 1 : 0,
          minHeight: spacing.minTouchTarget,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Transaction: ${transaction.payee_or_source || 'Item'}, ${isIncome ? '+' : '-'}${transaction.currency} ${transaction.amount}, ${transaction.categoryName || 'General'}`}
    >
      {/* Category Icon */}
      <View style={[styles.iconBox, { backgroundColor: catColor, borderRadius: radius.md }]}>
        {renderCategoryIconHelper(transaction.categoryIcon || 'DollarSign', '#FFFFFF', 18)}
      </View>

      {/* Payee / Note / Date */}
      <View style={styles.infoCol}>
        <View style={styles.payeeRow}>
          <Text
            style={[styles.payee, { color: colors.textPrimary, fontSize: typography.base }]}
            numberOfLines={1}
          >
            {transaction.payee_or_source || 'Unnamed Transaction'}
          </Text>
          {transaction.is_recurring && (
            <View style={[styles.recurringBadge, { backgroundColor: colors.bgSecondary }]}>
              <Repeat size={11} color={accent.primary} />
            </View>
          )}
        </View>

        <View style={styles.subRow}>
          <Text style={[styles.categoryName, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {transaction.categoryName || 'General'}
          </Text>
          {transaction.note ? (
            <Text
              style={[styles.noteSnippet, { color: colors.textSecondary, fontSize: typography.xs }]}
              numberOfLines={1}
            >
              • {transaction.note}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountCol}>
        <Text
          style={[
            styles.amount,
            {
              color: isIncome ? colors.success : colors.textPrimary,
              fontSize: typography.base,
            },
          ]}
        >
          {isIncome ? '+' : '-'}
          {transaction.currency === 'PHP'
            ? '₱'
            : transaction.currency === 'USD'
            ? '$'
            : `${transaction.currency} `}
          {transaction.amount.toLocaleString()}
        </Text>
        <Text style={[styles.dateText, { color: colors.textMuted, fontSize: 10 }]}>
          {transaction.date}
        </Text>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  payeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  payee: {
    fontWeight: '700',
  },
  recurringBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  categoryName: {
    fontWeight: '600',
  },
  noteSnippet: {
    flexShrink: 1,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '800',
  },
  dateText: {
    marginTop: 2,
  },
});
