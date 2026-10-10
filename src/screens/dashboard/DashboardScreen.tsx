/**
 * Life OS & Vault - Overview Dashboard Screen
 * Central Command Hub: Greeting, Backup Health, KPI Grid, Feeds, and Quick Actions FAB
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  ShieldCheck,
  KeyRound,
  Wallet,
  FileText,
  CheckCircle,
  ArrowUpRight,
  Lock,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  Calendar,
  Utensils,
  Briefcase,
  DollarSign,
  TrendingUp,
  Home,
  Zap,
  Car,
  ShoppingBag,
  HeartPulse,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  Button,
  Tag,
  FAB,
  SectionHeader,
  EmptyState,
  AWardenMark,
  AnimatedPatternBackground,
  ScreenEntrance,
} from '../../components/ui';
import { QuickActionsModal } from '../../components/dashboard/QuickActionsModal';
import { dbService } from '../../services/db';
import { VaultItem, Transaction, Task, DashboardStats } from '../../types/models';

export const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const { colors, accent, spacing, typography, radius, isDark } = useTheme();
  const { masterKey, lockNow } = useAuth();
  const isFocused = useIsFocused();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    netBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    vaultCount: 0,
    openTasksCount: 0,
    notesCount: 0,
    lastBackupTimestamp: null,
    userDisplayName: 'Ren',
  });

  const [recentTransactions, setRecentTransactions] = useState<(Transaction & { categoryName?: string; categoryColor?: string; categoryIcon?: string })[]>([]);
  const [recentVaultItems, setRecentVaultItems] = useState<VaultItem[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickActionModalVisible, setQuickActionModalVisible] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!masterKey) return;

    try {
      const [dashStats, transList, vaultList, taskList] = await Promise.all([
        dbService.getDashboardStats(),
        dbService.getRecentTransactions(masterKey, 5),
        dbService.getRecentVaultItems(masterKey, 3),
        dbService.getUpcomingTasks(masterKey, 3),
      ]);

      setStats(dashStats);
      setRecentTransactions(transList);
      setRecentVaultItems(vaultList);
      setUpcomingTasks(taskList);
    } catch (e) {
      console.warn('Failed to load dashboard data:', e);
    }
  }, [masterKey]);

  // Reload data whenever dashboard screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyPassword = async (item: VaultItem) => {
    if (!item.password) return;
    await Clipboard.setStringAsync(item.password);
    setCopiedId(item.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Auto-clear clipboard status after 3 seconds
    setTimeout(() => {
      setCopiedId(null);
    }, 3000);
  };

  const renderCategoryIcon = (iconName?: string, color?: string) => {
    const iconColor = color || accent.primary;
    const iconSize = 18;

    switch (iconName) {
      case 'Briefcase':
        return <Briefcase size={iconSize} color={iconColor} />;
      case 'DollarSign':
        return <DollarSign size={iconSize} color={iconColor} />;
      case 'TrendingUp':
        return <TrendingUp size={iconSize} color={iconColor} />;
      case 'Utensils':
        return <Utensils size={iconSize} color={iconColor} />;
      case 'Home':
        return <Home size={iconSize} color={iconColor} />;
      case 'Zap':
        return <Zap size={iconSize} color={iconColor} />;
      case 'Car':
        return <Car size={iconSize} color={iconColor} />;
      case 'ShoppingBag':
        return <ShoppingBag size={iconSize} color={iconColor} />;
      case 'HeartPulse':
        return <HeartPulse size={iconSize} color={iconColor} />;
      default:
        return <Wallet size={iconSize} color={iconColor} />;
    }
  };

  const renderBackupBanner = () => {
    if (!stats.lastBackupTimestamp) {
      return (
        <Card
          variant="flat"
          style={[styles.banner, { backgroundColor: colors.warningBg, borderColor: colors.warning, borderWidth: 1 }]}
        >
          <View style={styles.bannerRow}>
            <View style={[styles.bannerAccent, { backgroundColor: colors.warning }]} />
            <View
              style={[
                styles.bannerIconBox,
                { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle, borderRadius: radius.md },
              ]}
            >
              <AlertTriangle size={22} color={colors.warning} />
            </View>
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '700' }]}>
                No backup created yet
              </Text>
              <Text style={[styles.bannerSub, { color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 }]}>
                Export an encrypted backup to protect your private data.
              </Text>
            </View>
            <Button
              title="Backup"
              size="sm"
              variant="outline"
              onPress={() => router.push('/(tabs)/settings')}
              accessibilityLabel="Navigate to settings to create backup"
            />
          </View>
        </Card>
      );
    }

    const daysAgo = Math.floor((Date.now() - stats.lastBackupTimestamp) / (1000 * 60 * 60 * 24));
    const isStale = daysAgo >= 7;

    return (
      <Card
        variant="flat"
        style={[
          styles.banner,
          {
            backgroundColor: isStale ? colors.warningBg : colors.successBg,
            borderColor: isStale ? colors.warning : colors.success,
            borderWidth: 1,
          },
        ]}
      >
        <View style={styles.bannerRow}>
          <View style={[styles.bannerAccent, { backgroundColor: isStale ? colors.warning : colors.success }]} />
          <View
            style={[
              styles.bannerIconBox,
              { backgroundColor: colors.bgElevated, borderColor: colors.borderSubtle, borderRadius: radius.md },
            ]}
          >
            {isStale ? (
              <AlertTriangle size={22} color={colors.warning} />
            ) : (
              <ShieldCheck size={22} color={colors.success} />
            )}
          </View>
          <View style={styles.bannerText}>
            <Text style={[styles.bannerTitle, { color: colors.textPrimary, fontSize: typography.sm, fontWeight: '700' }]}>
              {daysAgo === 0 ? 'Backed up today' : `Backed up ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`}
            </Text>
            <Text style={[styles.bannerSub, { color: colors.textSecondary, fontSize: typography.xs, marginTop: 2 }]}>
              {isStale ? 'Your backup is over a week old.' : 'All local database files protected.'}
            </Text>
          </View>
          {isStale && (
            <Button
              title="Update"
              size="sm"
              variant="outline"
              onPress={() => router.push('/(tabs)/settings')}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <ScreenEntrance style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <AnimatedPatternBackground intensity={0.35} active={isFocused} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent.primary}
          />
        }
      >
        {/* 1. Greeting Header */}
        <View style={styles.topHeader}>
          <View style={styles.greetingTextContainer}>
            <Text
              style={[styles.greeting, { color: colors.textPrimary, fontSize: typography.xl }]}
              accessibilityRole="header"
            >
              {getGreeting()}, {stats.userDisplayName}!
            </Text>
            <Text style={[styles.date, { color: colors.textTertiary, fontSize: typography.sm }]}>
              {formattedDate}
            </Text>
          </View>
          <View
            style={[
              styles.mascotBadgeContainer,
              { backgroundColor: colors.bgCard, borderColor: colors.borderSubtle },
            ]}
          >
            <AWardenMark size={46} />
            <View style={[styles.mascotStatusDot, { backgroundColor: colors.success, borderColor: colors.bgPrimary }]} />
          </View>
        </View>

        {/* 2. Backup Health Banner */}
        {renderBackupBanner()}

        {/* 3. KPI Summary Cards (2x2 Grid) */}
        <View style={[styles.kpiGrid, { marginTop: spacing.md }]}>
          {/* Net Balance Card */}
          <Card
            variant="elevated"
            style={[styles.kpiCard, { flex: 1, marginRight: spacing.sm }]}
            onPress={() => router.push('/(tabs)/ledger')}
            accessibilityLabel={`Monthly net balance: ₱${stats.netBalance.toLocaleString()}`}
          >
            <View style={styles.kpiHeader}>
              <View
                style={[
                  styles.kpiIcon,
                  {
                    backgroundColor: colors.successBg,
                    borderColor: colors.surfaceHighlight,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Wallet size={20} color={colors.success} />
              </View>
              <View style={styles.kpiHeaderMeta}>
                <Tag label="This Month" size="sm" />
                <View
                  style={[
                    styles.kpiAction,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, borderRadius: radius.full },
                  ]}
                >
                  <ArrowUpRight size={14} color={colors.textTertiary} />
                </View>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.md }]}>
              ₱{stats.netBalance.toLocaleString()}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: typography.sm, marginTop: spacing.xs }]}>
              Net Balance
            </Text>
            <Text style={[styles.kpiDetail, { color: colors.textMuted, fontSize: typography.xs, marginTop: spacing.xs }]}>
              Income less expenses
            </Text>
          </Card>

          {/* Vault Items Card */}
          <Card
            variant="elevated"
            style={[styles.kpiCard, { flex: 1 }]}
            onPress={() => router.push('/(tabs)/vault')}
            accessibilityLabel={`Vault credentials: ${stats.vaultCount} items`}
          >
            <View style={styles.kpiHeader}>
              <View
                style={[
                  styles.kpiIcon,
                  {
                    backgroundColor: accent.primaryBgLight,
                    borderColor: colors.surfaceHighlight,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <Lock size={20} color={accent.primary} />
              </View>
              <View
                style={[
                  styles.kpiAction,
                  { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, borderRadius: radius.full },
                ]}
              >
                <ArrowUpRight size={14} color={colors.textTertiary} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.md }]}>
              {stats.vaultCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: typography.sm, marginTop: spacing.xs }]}>
              Vault Credentials
            </Text>
            <Text style={[styles.kpiDetail, { color: colors.textMuted, fontSize: typography.xs, marginTop: spacing.xs }]}>
              Protected locally
            </Text>
          </Card>
        </View>

        <View style={[styles.kpiGrid, { marginTop: spacing.md }]}>
          {/* Open Tasks Card */}
          <Card
            variant="elevated"
            style={[styles.kpiCard, { flex: 1, marginRight: spacing.sm }]}
            onPress={() => router.push('/(tabs)/tasks')}
            accessibilityLabel={`Active tasks: ${stats.openTasksCount}`}
          >
            <View style={styles.kpiHeader}>
              <View
                style={[
                  styles.kpiIcon,
                  {
                    backgroundColor: colors.warningBg,
                    borderColor: colors.surfaceHighlight,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <CheckCircle size={20} color={colors.warning} />
              </View>
              <View
                style={[
                  styles.kpiAction,
                  { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, borderRadius: radius.full },
                ]}
              >
                <ArrowUpRight size={14} color={colors.textTertiary} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.md }]}>
              {stats.openTasksCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: typography.sm, marginTop: spacing.xs }]}>
              Active Tasks
            </Text>
            <Text style={[styles.kpiDetail, { color: colors.textMuted, fontSize: typography.xs, marginTop: spacing.xs }]}>
              Due & in progress
            </Text>
          </Card>

          {/* Safe Notes Card */}
          <Card
            variant="elevated"
            style={[styles.kpiCard, { flex: 1 }]}
            onPress={() => router.push('/(tabs)/notes')}
            accessibilityLabel={`Safe notes: ${stats.notesCount}`}
          >
            <View style={styles.kpiHeader}>
              <View
                style={[
                  styles.kpiIcon,
                  {
                    backgroundColor: colors.infoBg,
                    borderColor: colors.surfaceHighlight,
                    borderRadius: radius.md,
                  },
                ]}
              >
                <FileText size={20} color={colors.info} />
              </View>
              <View
                style={[
                  styles.kpiAction,
                  { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, borderRadius: radius.full },
                ]}
              >
                <ArrowUpRight size={14} color={colors.textTertiary} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.md }]}>
              {stats.notesCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textSecondary, fontSize: typography.sm, marginTop: spacing.xs }]}>
              Safe Notes
            </Text>
            <Text style={[styles.kpiDetail, { color: colors.textMuted, fontSize: typography.xs, marginTop: spacing.xs }]}>
              Private workspace
            </Text>
          </Card>
        </View>

        {/* 4. Recent Activity Feeds */}

        {/* Feed A: Recent Transactions */}
        <SectionHeader
          title="Recent Transactions"
          subtitle="Last 5 records"
          actionText="See all"
          onActionPress={() => router.push('/(tabs)/ledger')}
          style={{ marginTop: spacing.xl }}
        />

        {recentTransactions.length === 0 ? (
          <Card variant="outlined">
            <EmptyState
              icon={<Wallet size={28} color={accent.primary} />}
              title="No Transactions Yet"
              description="Tap the + button to log your first income or expense."
            />
          </Card>
        ) : (
          <Card variant="outlined">
            {recentTransactions.map((tx, idx) => (
              <TouchableOpacity
                key={tx.id}
                onPress={() => router.push('/(tabs)/ledger')}
                style={[
                  styles.feedRow,
                  {
                    borderBottomWidth: idx < recentTransactions.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSubtle,
                    minHeight: spacing.minTouchTarget,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Transaction: ${tx.payee_or_source}, ₱${tx.amount}`}
              >
                <View
                  style={[
                    styles.feedIconBox,
                    {
                      backgroundColor: tx.type === 'income' ? colors.successBg : colors.dangerBg,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  {renderCategoryIcon(tx.categoryIcon, tx.type === 'income' ? colors.success : colors.danger)}
                </View>

                <View style={styles.feedInfo}>
                  <Text style={[styles.feedTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                    {tx.payee_or_source || 'Transaction'}
                  </Text>
                  <Text style={[styles.feedSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                    {tx.categoryName} • {tx.date}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.feedAmount,
                    {
                      color: tx.type === 'income' ? colors.success : colors.textPrimary,
                      fontSize: typography.sm,
                    },
                  ]}
                >
                  {tx.type === 'income' ? '+' : '-'}₱{tx.amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
        )}

        {/* Feed B: Recent Credentials */}
        <SectionHeader
          title="Recent Credentials"
          subtitle="Quick copy & access"
          actionText="See all"
          onActionPress={() => router.push('/(tabs)/vault')}
          style={{ marginTop: spacing.xl }}
        />

        {recentVaultItems.length === 0 ? (
          <Card variant="outlined">
            <EmptyState
              icon={<KeyRound size={28} color={accent.primary} />}
              title="Vault is Empty"
              description="Safely store logins and accounts protected by AES-256."
            />
          </Card>
        ) : (
          <Card variant="outlined">
            {recentVaultItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.feedRow,
                  {
                    borderBottomWidth: idx < recentVaultItems.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSubtle,
                    minHeight: spacing.minTouchTarget,
                  },
                ]}
              >
                <View
                  style={[
                    styles.feedIconBox,
                    { backgroundColor: accent.primaryBgLight, borderRadius: radius.md },
                  ]}
                >
                  <KeyRound size={18} color={accent.primary} />
                </View>

                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/vault')}
                  style={styles.feedInfo}
                  accessibilityRole="button"
                  accessibilityLabel={`Credential for ${item.title}`}
                >
                  <Text style={[styles.feedTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.feedSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                    {item.username ? `••••${item.username.slice(-3)}` : 'No username'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleCopyPassword(item)}
                  style={[
                    styles.copyBtn,
                    {
                      backgroundColor: copiedId === item.id ? colors.successBg : colors.bgSecondary,
                      borderRadius: radius.md,
                      minHeight: spacing.minTouchTarget,
                      minWidth: spacing.minTouchTarget,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy password for ${item.title}`}
                >
                  {copiedId === item.id ? (
                    <Check size={16} color={colors.success} />
                  ) : (
                    <Copy size={16} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </Card>
        )}

        {/* Feed C: Upcoming Tasks */}
        <SectionHeader
          title="Upcoming Tasks"
          subtitle="Priorities & deadlines"
          actionText="See all"
          onActionPress={() => router.push('/(tabs)/tasks')}
          style={{ marginTop: spacing.xl }}
        />

        {upcomingTasks.length === 0 ? (
          <Card variant="outlined" style={{ marginBottom: spacing.huge }}>
            <EmptyState
              icon={<CheckCircle size={28} color={colors.warning} />}
              title="All Caught Up!"
              description="No pending tasks due. Create new goals to track progress."
            />
          </Card>
        ) : (
          <Card variant="outlined" style={{ marginBottom: spacing.huge }}>
            {upcomingTasks.map((task, idx) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => router.push('/(tabs)/tasks')}
                style={[
                  styles.feedRow,
                  {
                    borderBottomWidth: idx < upcomingTasks.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSubtle,
                    minHeight: spacing.minTouchTarget,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Task: ${task.title}, priority: ${task.priority}`}
              >
                <View
                  style={[
                    styles.priorityDot,
                    {
                      backgroundColor:
                        task.priority === 'high'
                          ? colors.danger
                          : task.priority === 'medium'
                          ? colors.warning
                          : accent.primary,
                    },
                  ]}
                />

                <View style={styles.feedInfo}>
                  <Text style={[styles.feedTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                    {task.title}
                  </Text>
                  {task.due_date && (
                    <View style={styles.taskDueDate}>
                      <Calendar size={12} color={colors.textTertiary} style={{ marginRight: 4 }} />
                      <Text style={[styles.feedSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                        {task.due_date}
                      </Text>
                    </View>
                  )}
                </View>

                <Tag
                  label={task.priority.toUpperCase()}
                  size="sm"
                  color={
                    task.priority === 'high'
                      ? colors.danger
                      : task.priority === 'medium'
                      ? colors.warning
                      : accent.primary
                  }
                />
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setQuickActionModalVisible(true);
        }}
        accessibilityLabel="Open Quick Capture"
      />

      {/* Quick Actions Bottom Sheet Modal */}
      <QuickActionsModal
        visible={quickActionModalVisible}
        onClose={() => setQuickActionModalVisible(false)}
        onDataCreated={() => {
          loadDashboardData();
        }}
      />
    </ScreenEntrance>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 132,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  mascotBadgeContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotStatusDot: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  greeting: {
    fontWeight: '800',
  },
  date: {
    marginTop: 2,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  securityBadgeText: {
    fontWeight: '600',
  },
  banner: {
    padding: 12,
    marginBottom: 14,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerAccent: {
    width: 4,
    alignSelf: 'stretch',
    minHeight: 42,
    borderRadius: 2,
    marginRight: 10,
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    paddingRight: 8,
  },
  bannerTitle: {},
  bannerSub: {},
  kpiGrid: {
    flexDirection: 'row',
  },
  kpiCard: {
    padding: 18,
    minHeight: 150,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiHeaderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  kpiAction: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  kpiValue: {
    fontWeight: '800',
  },
  kpiLabel: {
    fontWeight: '700',
  },
  kpiDetail: {
    fontWeight: '500',
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  feedIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  feedInfo: {
    flex: 1,
  },
  feedTitle: {
    fontWeight: '600',
  },
  feedSub: {
    marginTop: 2,
  },
  feedAmount: {
    fontWeight: '700',
    marginLeft: 8,
  },
  copyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginLeft: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  taskDueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
});

export default DashboardScreen;
