import React, { useState } from 'react';
import {
  View,
  Text,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { ArrowDownLeft, ArrowUpRight, CreditCard, Eye, EyeOff, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { AnimatedPressable } from '../ui/AnimatedPressable';

export interface VirtualAccountCardProps {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  onAddIncome: () => void;
  onAddExpense: () => void;
}

type WebAccountCardStyle = ViewStyle & {
  boxShadow?: string;
};

export const VirtualAccountCard: React.FC<VirtualAccountCardProps> = ({
  balance,
  totalIncome,
  totalExpense,
  onAddIncome,
  onAddExpense,
}) => {
  const { colors, accent, typography, radius, isDark } = useTheme();
  const [showBalance, setShowBalance] = useState(true);

  const cardShadow: WebAccountCardStyle =
    Platform.OS === 'web'
      ? {
          boxShadow: `10px 12px 24px ${colors.surfaceShadow}, -7px -7px 18px ${colors.surfaceHighlight}`,
        }
      : {
          shadowColor: colors.surfaceShadow,
          shadowOffset: { width: 6, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 14,
          elevation: 8,
        };

  const formatAmount = (amount: number) => `₱${Math.abs(amount).toLocaleString()}`;
  const balanceColor = balance < 0 ? colors.danger : colors.textPrimary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.bgElevated : colors.bgCard,
          borderColor: colors.borderSubtle,
          borderRadius: radius.xxl,
        },
        cardShadow,
      ]}
      accessibilityLabel="AWarden virtual ledger account"
    >
      <View style={[styles.orb, { backgroundColor: accent.primary }]} />
      <View style={[styles.orbSecondary, { backgroundColor: colors.surfaceHighlight }]} />

      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <View
            style={[
              styles.cardMark,
              {
                backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight,
                borderColor: colors.borderSubtle,
                borderRadius: radius.md,
              },
            ]}
          >
            <CreditCard size={20} color={accent.primary} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: colors.textTertiary, fontSize: typography.xs }]}>AWARDEN</Text>
            <Text style={[styles.accountType, { color: colors.textPrimary, fontSize: typography.sm }]}>Virtual ledger account</Text>
          </View>
        </View>

        <AnimatedPressable
          onPress={() => setShowBalance((visible) => !visible)}
          style={[
            styles.visibilityButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
              borderColor: colors.borderSubtle,
              borderRadius: radius.full,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={showBalance ? 'Hide virtual ledger balance' : 'Show virtual ledger balance'}
        >
          {showBalance ? <Eye size={16} color={colors.textSecondary} /> : <EyeOff size={16} color={colors.textSecondary} />}
        </AnimatedPressable>
      </View>

      <View style={styles.balanceRow}>
        <View>
          <Text style={[styles.balanceLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>AVAILABLE LEDGER BALANCE</Text>
          <Text style={[styles.balanceValue, { color: balanceColor, fontSize: typography.xxl }]}>
            {showBalance ? `${balance < 0 ? '-' : ''}${formatAmount(balance)}` : '••••••'}
          </Text>
        </View>
        <View
          style={[
            styles.localBadge,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
              borderColor: colors.borderSubtle,
              borderRadius: radius.full,
            },
          ]}
        >
          <ShieldCheck size={13} color={accent.primary} />
          <Text style={[styles.localBadgeText, { color: colors.textSecondary, fontSize: typography.xs }]}>LOCAL ONLY</Text>
        </View>
      </View>

      <View style={styles.accountMetaRow}>
        <Text style={[styles.accountNumber, { color: colors.textSecondary, fontSize: typography.sm }]}>•••• 2048</Text>
        <Text style={[styles.accountMeta, { color: colors.textTertiary, fontSize: typography.xs }]}>PHP · THIS MONTH</Text>
      </View>

      <View style={styles.flowRow}>
        <View style={styles.flowItem}>
          <ArrowDownLeft size={14} color={colors.success} />
          <Text style={[styles.flowText, { color: colors.textSecondary, fontSize: typography.xs }]}>In {formatAmount(totalIncome)}</Text>
        </View>
        <View style={styles.flowItem}>
          <ArrowUpRight size={14} color={colors.danger} />
          <Text style={[styles.flowText, { color: colors.textSecondary, fontSize: typography.xs }]}>Out {formatAmount(totalExpense)}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <AnimatedPressable
          onPress={onAddIncome}
          style={[styles.actionButton, { backgroundColor: accent.primary, borderColor: accent.primary, borderRadius: radius.md }]}
          accessibilityRole="button"
          accessibilityLabel="Add money to virtual ledger account"
        >
          <ArrowDownLeft size={15} color={accent.contrastText} />
          <Text style={[styles.primaryActionText, { color: accent.contrastText, fontSize: typography.xs }]}>Add money</Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={onAddExpense}
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)',
              borderColor: colors.borderSubtle,
              borderRadius: radius.md,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Log expense from virtual ledger account"
        >
          <ArrowUpRight size={15} color={colors.textSecondary} />
          <Text style={[styles.secondaryActionText, { color: colors.textSecondary, fontSize: typography.xs }]}>Log expense</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    minHeight: 228,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  orb: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -78,
    top: -92,
    opacity: 0.12,
  },
  orbSecondary: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    left: -70,
    bottom: -82,
    opacity: 0.08,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 10,
  },
  eyebrow: {
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  accountType: {
    fontWeight: '700',
    marginTop: 1,
  },
  visibilityButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  balanceLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  balanceValue: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  localBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  localBadgeText: {
    fontWeight: '800',
    letterSpacing: 0.4,
    marginLeft: 4,
  },
  accountMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  accountNumber: {
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  accountMeta: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 13,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  primaryActionText: {
    fontWeight: '800',
    marginLeft: 5,
  },
  secondaryActionText: {
    fontWeight: '700',
    marginLeft: 5,
  },
});
