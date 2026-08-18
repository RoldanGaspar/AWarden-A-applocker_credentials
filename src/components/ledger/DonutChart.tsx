/**
 * Life OS & Vault - Accessible SVG Donut Chart
 * Visualizes category spending distribution with interactive slices and data table
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { G, Path, Circle, Text as SvgText } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { renderCategoryIconHelper } from './CategoryManagerModal';
import { CategorySpendingItem } from '../../types/models';

export interface DonutChartProps {
  data: CategorySpendingItem[];
  totalAmount: number;
  currencySymbol?: string;
  onSelectCategory?: (categoryId: string) => void;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalAmount,
  currencySymbol = '₱',
  onSelectCategory,
  size = 200,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  if (!data || data.length === 0 || totalAmount <= 0) {
    return (
      <View style={[styles.emptyContainer, { padding: spacing.lg }]}>
        <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.sm }]}>
          No expense transactions logged for this period.
        </Text>
      </View>
    );
  }

  const radiusOuter = size / 2 - 10;
  const radiusInner = radiusOuter * 0.65;
  const center = size / 2;

  // Compute SVG paths for each slice
  let startAngle = 0;
  const slices = data.map((item) => {
    const angle = (item.totalAmount / totalAmount) * 360;
    const endAngle = startAngle + angle;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1Outer = center + radiusOuter * Math.cos(startRad);
    const y1Outer = center + radiusOuter * Math.sin(startRad);
    const x2Outer = center + radiusOuter * Math.cos(endRad);
    const y2Outer = center + radiusOuter * Math.sin(endRad);

    const x1Inner = center + radiusInner * Math.cos(endRad);
    const y1Inner = center + radiusInner * Math.sin(endRad);
    const x2Inner = center + radiusInner * Math.cos(startRad);
    const y2Inner = center + radiusInner * Math.sin(startRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    // Path command for donut sector
    const d = `
      M ${x1Outer} ${y1Outer}
      A ${radiusOuter} ${radiusOuter} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}
      L ${x1Inner} ${y1Inner}
      A ${radiusInner} ${radiusInner} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}
      Z
    `;

    startAngle = endAngle;
    return { ...item, path: d };
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size}>
          <G>
            {slices.map((s, idx) => (
              <Path
                key={`${s.categoryId}_${idx}`}
                d={s.path}
                fill={s.categoryColor}
                stroke={colors.bgPrimary}
                strokeWidth={2}
              />
            ))}
            {/* Center total text */}
            <SvgText
              x={center}
              y={center - 6}
              textAnchor="middle"
              fill={colors.textTertiary}
              fontSize={11}
              fontWeight="600"
            >
              TOTAL EXPENSE
            </SvgText>
            <SvgText
              x={center}
              y={center + 14}
              textAnchor="middle"
              fill={colors.textPrimary}
              fontSize={15}
              fontWeight="bold"
            >
              {currencySymbol}{totalAmount.toLocaleString()}
            </SvgText>
          </G>
        </Svg>
      </View>

      {/* Accessible Legend & Data Table */}
      <View style={styles.legendContainer}>
        {data.map((item) => (
          <TouchableOpacity
            key={item.categoryId}
            onPress={() => {
              if (onSelectCategory) {
                Haptics.selectionAsync().catch(() => {});
                onSelectCategory(item.categoryId);
              }
            }}
            style={[
              styles.legendRow,
              { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1, minHeight: spacing.minTouchTarget },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.categoryName}: ${currencySymbol}${item.totalAmount.toLocaleString()}, ${item.percentage.toFixed(1)}% of expenses`}
          >
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: item.categoryColor }]} />
              <View style={[styles.legendIconBox, { backgroundColor: colors.bgSecondary, borderRadius: radius.xs }]}>
                {renderCategoryIconHelper(item.categoryIcon, item.categoryColor, 14)}
              </View>
              <Text style={[styles.legendName, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {item.categoryName}
              </Text>
            </View>

            <View style={styles.legendRight}>
              <Text style={[styles.legendAmount, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {currencySymbol}{item.totalAmount.toLocaleString()}
              </Text>
              <Text style={[styles.legendPercent, { color: colors.textTertiary, fontSize: typography.xs }]}>
                {item.percentage.toFixed(1)}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  legendContainer: {
    width: '100%',
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendIconBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  legendName: {
    fontWeight: '600',
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontWeight: '700',
  },
  legendPercent: {
    marginTop: 1,
  },
});
