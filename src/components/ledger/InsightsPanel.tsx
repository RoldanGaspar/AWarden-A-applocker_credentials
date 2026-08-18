/**
 * Life OS & Vault - Financial Insights & Analytics Panel
 * Overview cards, Category Spending Donut Chart, and 6-Month Income vs Expense Bar Chart
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  BarChart2,
  Award,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card, SectionHeader, Tag } from '../ui';
import { DonutChart } from './DonutChart';
import { GroupedBarChart } from './GroupedBarChart';
import { dbService } from '../../services/db';
import {
  CategorySpendingItem,
  MonthlySeriesItem,
} from '../../types/models';

export interface InsightsPanelProps {
  onSelectCategory?: (categoryId: string) => void;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  onSelectCategory,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [spendingData, setSpendingData] = useState<CategorySpendingItem[]>([]);
  const [monthlySeries, setMonthlySeries] = useState<MonthlySeriesItem[]>([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0,
  });

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const loadInsights = useCallback(async () => {
    if (!masterKey) return;
    try {
      const [spending, series, financialSummary] = await Promise.all([
        dbService.getSpendingByCategory(currentMonthKey),
        dbService.getMonthlyIncomeExpenseSeries(6),
        dbService.getFinancialSummary(currentMonthKey),
      ]);

      setSpendingData(spending);
      setMonthlySeries(series);
      setSummary(financialSummary);
    } catch (e) {
      console.warn('Failed to load insights:', e);
    }
  }, [masterKey, currentMonthKey]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const topCategory = spendingData.length > 0 ? spendingData[0] : null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 4 Summary Cards Grid */}
      <View style={styles.gridRow}>
        {/* Total Income */}
        <Card
          variant="elevated"
          style={[styles.summaryCard, { flex: 1, marginRight: spacing.sm }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              INCOME
            </Text>
            <View style={[styles.iconBox, { backgroundColor: colors.successBg, borderRadius: radius.xs }]}>
              <ArrowDownLeft size={14} color={colors.success} />
            </View>
          </View>
          <Text style={[styles.cardValue, { color: colors.success, fontSize: typography.lg, marginTop: 4 }]}>
            +₱{summary.totalIncome.toLocaleString()}
          </Text>
        </Card>

        {/* Total Expense */}
        <Card variant="elevated" style={[styles.summaryCard, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              EXPENSES
            </Text>
            <View style={[styles.iconBox, { backgroundColor: colors.dangerBg, borderRadius: radius.xs }]}>
              <ArrowUpRight size={14} color={colors.danger} />
            </View>
          </View>
          <Text style={[styles.cardValue, { color: colors.danger, fontSize: typography.lg, marginTop: 4 }]}>
            -₱{summary.totalExpense.toLocaleString()}
          </Text>
        </Card>
      </View>

      <View style={[styles.gridRow, { marginTop: spacing.sm }]}>
        {/* Net Savings */}
        <Card
          variant="elevated"
          style={[styles.summaryCard, { flex: 1, marginRight: spacing.sm }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              NET SAVINGS
            </Text>
            <View style={[styles.iconBox, { backgroundColor: accent.primaryBgLight, borderRadius: radius.xs }]}>
              <TrendingUp size={14} color={accent.primary} />
            </View>
          </View>
          <Text
            style={[
              styles.cardValue,
              {
                color: summary.netBalance >= 0 ? colors.textPrimary : colors.danger,
                fontSize: typography.lg,
                marginTop: 4,
              },
            ]}
          >
            ₱{summary.netBalance.toLocaleString()}
          </Text>
        </Card>

        {/* Top Expense Category */}
        <Card variant="elevated" style={[styles.summaryCard, { flex: 1 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              TOP SPENDING
            </Text>
            <View style={[styles.iconBox, { backgroundColor: colors.warningBg, borderRadius: radius.xs }]}>
              <Award size={14} color={colors.warning} />
            </View>
          </View>
          <Text
            style={[styles.cardValue, { color: colors.textPrimary, fontSize: typography.sm, marginTop: 4 }]}
            numberOfLines={1}
          >
            {topCategory ? topCategory.categoryName : 'None'}
          </Text>
          {topCategory ? (
            <Text style={[styles.topCategoryAmount, { color: colors.textTertiary, fontSize: typography.xs }]}>
              ₱{topCategory.totalAmount.toLocaleString()} ({topCategory.percentage.toFixed(0)}%)
            </Text>
          ) : null}
        </Card>
      </View>

      {/* Chart 1: Spending by Category (Donut) */}
      <SectionHeader
        title="Category Breakdown"
        subtitle="This month's expense distribution"
        icon={<PieChart size={18} color={accent.primary} />}
        style={{ marginTop: spacing.lg }}
      />

      <Card variant="outlined" style={styles.chartCard}>
        <DonutChart
          data={spendingData}
          totalAmount={summary.totalExpense}
          onSelectCategory={onSelectCategory}
        />
      </Card>

      {/* Chart 2: 6-Month Income vs Expense */}
      <SectionHeader
        title="6-Month Cash Flow"
        subtitle="Historical income vs expense trend"
        icon={<BarChart2 size={18} color={accent.primary} />}
        style={{ marginTop: spacing.lg }}
      />

      <Card variant="outlined" style={[styles.chartCard, { marginBottom: spacing.huge }]}>
        <GroupedBarChart series={monthlySeries} />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  gridRow: {
    flexDirection: 'row',
  },
  summaryCard: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontWeight: '800',
  },
  topCategoryAmount: {
    marginTop: 2,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCard: {
    padding: 16,
    alignItems: 'center',
  },
});
