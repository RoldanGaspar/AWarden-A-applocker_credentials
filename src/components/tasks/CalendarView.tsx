/**
 * Life OS & Vault - Unified Interactive Calendar Component
 * High-performance month grid displaying task priority dots and financial cash flow indicators
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Button } from '../ui';
import { dbService } from '../../services/db';
import { CalendarDayEvents } from '../../types/models';
import { getPriorityColor } from './TaskCard';

export interface CalendarViewProps {
  onSelectDate: (dateIso: string) => void;
  refreshTrigger?: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onSelectDate,
  refreshTrigger,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [eventsMap, setEventsMap] = useState<Map<string, CalendarDayEvents>>(new Map());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  useEffect(() => {
    if (masterKey) {
      loadMonthEvents();
    }
  }, [masterKey, year, month, refreshTrigger]);

  const loadMonthEvents = async () => {
    if (!masterKey) return;
    try {
      const data = await dbService.getCalendarEventsForMonth(masterKey, year, month);
      setEventsMap(data);
    } catch (e) {
      console.warn('Failed to load calendar events:', e);
    }
  };

  const handlePrevMonth = () => {
    Haptics.selectionAsync().catch(() => {});
    setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync().catch(() => {});
    setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1));
  };

  const handleJumpToday = () => {
    Haptics.selectionAsync().catch(() => {});
    setCurrentDate(new Date());
  };

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const todayIso = new Date().toISOString().split('T')[0];

  // Generate calendar days grid (weeks)
  const calendarWeeks = useMemo(() => {
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevMonthDays = new Date(year, month - 1, 0).getDate();

    const days: { day: number; dateIso: string; isCurrentMonth: boolean }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = month === 1 ? 12 : month - 1;
      const prevY = month === 1 ? year - 1 : year;
      const dateIso = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateIso, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateIso = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateIso, isCurrentMonth: true });
    }

    // Trailing days from next month
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 12 ? 1 : month + 1;
      const nextY = month === 12 ? year + 1 : year;
      const dateIso = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, dateIso, isCurrentMonth: false });
    }

    // Split into weeks of 7
    const weeks: { day: number; dateIso: string; isCurrentMonth: boolean }[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [year, month]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card variant="outlined" style={styles.container}>
      {/* Month Navigation Header */}
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={[styles.navBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleJumpToday} style={styles.monthTitleBox}>
          <Text style={[styles.monthTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
            {monthLabel}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={[styles.navBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <ChevronRight size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Row */}
      <View style={styles.weekdayRow}>
        {daysOfWeek.map((dow, idx) => (
          <View key={dow} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                { color: idx === 0 || idx === 6 ? colors.textMuted : colors.textTertiary, fontSize: typography.xs },
              ]}
            >
              {dow}
            </Text>
          </View>
        ))}
      </View>

      {/* Days Grid */}
      <View style={styles.grid}>
        {calendarWeeks.map((week, wIdx) => (
          <View key={wIdx} style={styles.weekRow}>
            {week.map((cell) => {
              const isToday = cell.dateIso === todayIso;
              const event = eventsMap.get(cell.dateIso);
              const hasTasks = event && event.tasks.length > 0;
              const hasTransactions = event && event.transactions.length > 0;

              const priorityColor = event?.highestPriority ? getPriorityColor(event.highestPriority) : accent.primary;

              return (
                <TouchableOpacity
                  key={cell.dateIso}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onSelectDate(cell.dateIso);
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.dayCell,
                    {
                      backgroundColor: isToday ? accent.primaryBgLight : 'transparent',
                      borderColor: isToday ? accent.primary : 'transparent',
                      borderRadius: radius.md,
                      minHeight: 46,
                      minWidth: 44,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${cell.dateIso}: ${hasTasks ? `${event!.tasks.length} tasks` : 'no tasks'}, ${hasTransactions ? `${event!.transactions.length} transactions` : 'no transactions'}`}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        color: !cell.isCurrentMonth
                          ? colors.textMuted
                          : isToday
                          ? accent.primary
                          : colors.textPrimary,
                        fontWeight: isToday ? '800' : '600',
                        fontSize: typography.sm,
                      },
                    ]}
                  >
                    {cell.day}
                  </Text>

                  {/* Indicator Dots */}
                  <View style={styles.dotsRow}>
                    {hasTasks && (
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: priorityColor },
                        ]}
                      />
                    )}
                    {hasTransactions && (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: event!.hasIncome
                              ? colors.success
                              : colors.danger,
                          },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={[styles.legendRow, { borderTopColor: colors.borderSubtle }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary, fontSize: 10 }]}>
            High Priority Task
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary, fontSize: 10 }]}>
            Income Logged
          </Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textTertiary, fontSize: 10 }]}>
            Expense Logged
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  navBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  monthTitleBox: {
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontWeight: '800',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontWeight: '700',
  },
  grid: {},
  weekRow: {
    flexDirection: 'row',
    marginVertical: 1,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderWidth: 1,
  },
  dayNumber: {},
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontWeight: '600',
  },
});
