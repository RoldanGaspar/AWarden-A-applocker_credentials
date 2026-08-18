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
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Clock,
  HardDrive,
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
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Tag, FAB, SectionHeader, EmptyState } from '../../components/ui';
import { QuickActionsModal } from '../../components/dashboard/QuickActionsModal';
import { dbService } from '../../services/db';
import { VaultItem, Transaction, Task, DashboardStats } from '../../types/models';

export const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const { colors, accent, spacing, typography, radius, isDark } = useTheme();
  const { masterKey, lockNow } = useAuth();

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
            <View style={[styles.bannerIconBox, { backgroundColor: colors.bgElevated, borderRadius: radius.md }]}>
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
          <View style={[styles.bannerIconBox, { backgroundColor: colors.bgElevated, borderRadius: radius.md }]}>
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
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
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
          <View>
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
              styles.securityBadge,
              { backgroundColor: accent.primaryBgDark, borderColor: accent.primary },
            ]}
          >
            <ShieldCheck size={16} color={accent.primary} />
            <Text
              style={[
                styles.securityBadgeText,
                { color: accent.primary, fontSize: typography.xs, marginLeft: 4 },
              ]}
            >
              Vault Active
            </Text>
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
              <View style={[styles.kpiIcon, { backgroundColor: colors.successBg, borderRadius: radius.md }]}>
                <Wallet size={20} color={colors.success} />
              </View>
              <Tag label="This Month" size="sm" />
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.sm }]}>
              ₱{stats.netBalance.toLocaleString()}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textTertiary, fontSize: typography.xs, marginTop: 2 }]}>
              Net Balance
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
              <View style={[styles.kpiIcon, { backgroundColor: accent.primaryBgLight, borderRadius: radius.md }]}>
                <Lock size={20} color={accent.primary} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.sm }]}>
              {stats.vaultCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textTertiary, fontSize: typography.xs, marginTop: 2 }]}>
              Vault Credentials
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
              <View style={[styles.kpiIcon, { backgroundColor: colors.warningBg, borderRadius: radius.md }]}>
                <CheckCircle size={20} color={colors.warning} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.sm }]}>
              {stats.openTasksCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textTertiary, fontSize: typography.xs, marginTop: 2 }]}>
              Active Tasks
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
              <View style={[styles.kpiIcon, { backgroundColor: colors.infoBg, borderRadius: radius.md }]}>
                <FileText size={20} color={colors.info} />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.textPrimary, fontSize: typography.xl, marginTop: spacing.sm }]}>
              {stats.notesCount}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.textTertiary, fontSize: typography.xs, marginTop: 2 }]}>
              Safe Notes
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
        accessibilityLabel="Open Quick Actions menu"
      />

      {/* Quick Actions Bottom Sheet Modal */}
      <QuickActionsModal
        visible={quickActionModalVisible}
        onClose={() => setQuickActionModalVisible(false)}
        onDataCreated={() => {
          loadDashboardData();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    padding: 14,
    marginBottom: 12,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIconBox: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    padding: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontWeight: '800',
  },
  kpiLabel: {
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
