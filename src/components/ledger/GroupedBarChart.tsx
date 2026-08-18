/**
 * Life OS & Vault - Grouped Bar Chart (Income vs Expense)
 * Displays 6-month historical comparison with side-by-side SVG bars and accessible data table
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { MonthlySeriesItem } from '../../types/models';

export interface GroupedBarChartProps {
  series: MonthlySeriesItem[];
  currencySymbol?: string;
  height?: number;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  series,
  currencySymbol = '₱',
  height = 180,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  if (!series || series.length === 0) {
    return (
      <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>
          No historical transaction data available.
        </Text>
      </View>
    );
  }

  const maxVal = Math.max(
    ...series.map((s) => Math.max(s.income, s.expense)),
    1000
  );

  const chartWidth = 320;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingBottom = 25;
  const paddingTop = 15;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom;

  const barGroupWidth = plotWidth / series.length;
  const singleBarWidth = Math.max(8, (barGroupWidth - 12) / 2);

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
            Income
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontSize: typography.xs }]}>
            Expense
          </Text>
        </View>
      </View>

      {/* SVG Chart */}
      <View style={styles.svgWrapper}>
        <Svg width={chartWidth} height={height}>
          {/* Grid lines */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingTop + plotHeight * (1 - ratio);
            return (
              <React.Fragment key={idx}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke={colors.borderSubtle}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                />
              </React.Fragment>
            );
          })}

          {/* Bars */}
          {series.map((item, idx) => {
            const groupX = paddingLeft + idx * barGroupWidth;
            const incHeight = (item.income / maxVal) * plotHeight;
            const expHeight = (item.expense / maxVal) * plotHeight;

            const incX = groupX + 4;
            const expX = incX + singleBarWidth + 2;

            const incY = paddingTop + plotHeight - incHeight;
            const expY = paddingTop + plotHeight - expHeight;

            return (
              <React.Fragment key={item.monthKey}>
                {/* Income Bar */}
                <Rect
                  x={incX}
                  y={incY}
                  width={singleBarWidth}
                  height={Math.max(2, incHeight)}
                  fill={colors.success}
                  rx={2}
                />

                {/* Expense Bar */}
                <Rect
                  x={expX}
                  y={expY}
                  width={singleBarWidth}
                  height={Math.max(2, expHeight)}
                  fill={colors.danger}
                  rx={2}
                />

                {/* Month label */}
                <SvgText
                  x={groupX + barGroupWidth / 2}
                  y={height - 6}
                  textAnchor="middle"
                  fill={colors.textTertiary}
                  fontSize={10}
                  fontWeight="600"
                >
                  {item.monthLabel}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Data Table */}
      <View style={styles.tableContainer}>
        <Text style={[styles.tableHeader, { color: colors.textTertiary, fontSize: 10 }]}>
          MONTHLY BREAKDOWN
        </Text>
        {series.slice().reverse().map((item) => (
          <View
            key={item.monthKey}
            style={[styles.tableRow, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]}
          >
            <Text style={[styles.tableMonth, { color: colors.textPrimary, fontSize: typography.xs }]}>
              {item.monthKey}
            </Text>
            <Text style={[styles.tableIncome, { color: colors.success, fontSize: typography.xs }]}>
              +{currencySymbol}{item.income.toLocaleString()}
            </Text>
            <Text style={[styles.tableExpense, { color: colors.danger, fontSize: typography.xs }]}>
              -{currencySymbol}{item.expense.toLocaleString()}
            </Text>
            <Text
              style={[
                styles.tableNet,
                { color: item.net >= 0 ? colors.success : colors.danger, fontSize: typography.xs, fontWeight: '700' },
              ]}
            >
              {item.net >= 0 ? '+' : ''}{currencySymbol}{item.net.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontWeight: '600',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableContainer: {
    width: '100%',
    marginTop: 12,
  },
  tableHeader: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tableMonth: {
    fontWeight: '600',
    flex: 1.2,
  },
  tableIncome: {
    flex: 1,
    textAlign: 'right',
  },
  tableExpense: {
    flex: 1,
    textAlign: 'right',
  },
  tableNet: {
    flex: 1.2,
    textAlign: 'right',
  },
});
