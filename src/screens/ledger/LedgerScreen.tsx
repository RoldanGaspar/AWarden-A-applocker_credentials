/**
 * Life OS & Vault - Multi-Currency Budget Ledger Screen
 * Manages income and expenses, visual budget limits, SVG insights, category manager, and transaction CRUD
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Wallet,
  Plus,
  Search,
  SlidersHorizontal,
  Settings,
  PieChart,
  List,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  Repeat,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Input, Tag, FAB, Modal, Button, EmptyState } from '../../components/ui';
import {
  TransactionRow,
  TransactionForm,
  CategoryManagerModal,
  BudgetProgressBar,
  InsightsPanel,
} from '../../components/ledger';
import { dbService } from '../../services/db';
import {
  Transaction,
  Category,
  BudgetOverviewItem,
  TransactionType,
} from '../../types/models';

export const LedgerScreen: React.FC = () => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [activeTab, setActiveTab] = useState<'transactions' | 'insights'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverviewItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Modals
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const loadLedgerData = useCallback(async () => {
    if (!masterKey) return;

    try {
      const [txList, catList, budgets] = await Promise.all([
        dbService.getTransactions(masterKey, {
          search: searchQuery,
          type: typeFilter,
          dateRange: dateRangeFilter,
          categoryId: selectedCategoryId,
        }),
        dbService.getCategories(),
        dbService.getBudgetOverview(currentMonthPrefix),
      ]);

      setTransactions(txList);
      setCategories(catList);
      setBudgetOverview(budgets);
    } catch (e) {
      console.warn('Failed to load ledger data:', e);
    }
  }, [masterKey, searchQuery, typeFilter, dateRangeFilter, selectedCategoryId, currentMonthPrefix]);

  useFocusEffect(
    useCallback(() => {
      loadLedgerData();
    }, [loadLedgerData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLedgerData();
    setRefreshing(false);
  };

  const handleCreateTransaction = async (item: Omit<Transaction, 'created_at'>) => {
    if (!masterKey) return;
    await dbService.createTransaction(item, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsAddModalVisible(false);
    await loadLedgerData();
  };

  const handleUpdateTransaction = async (item: Omit<Transaction, 'created_at'>) => {
    if (!masterKey) return;
    const fullItem: Transaction = {
      ...item,
      created_at: editingTransaction?.created_at || Date.now(),
    };
    await dbService.updateTransaction(fullItem, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setEditingTransaction(null);
    await loadLedgerData();
  };

  const handleDuplicate = async (tx: Transaction) => {
    if (!masterKey) return;
    await dbService.duplicateTransaction(tx.id, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await loadLedgerData();
  };

  const handleDelete = (tx: Transaction) => {
    Alert.alert(
      'Delete Transaction?',
      `Are you sure you want to delete "${tx.payee_or_source || 'this transaction'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dbService.deleteTransaction(tx.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            await loadLedgerData();
          },
        },
      ]
    );
  };

  // Group transactions by date for SectionList
  const groupedSections = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    const groups = new Map<string, Transaction[]>();

    transactions.forEach((tx) => {
      const dateKey = tx.date || 'Unknown Date';
      const existing = groups.get(dateKey) || [];
      existing.push(tx);
      groups.set(dateKey, existing);
    });

    const sections: { title: string; date: string; data: Transaction[] }[] = [];

    Array.from(groups.keys()).sort().reverse().forEach((d) => {
      let title = d;
      if (d === today) {
        title = 'Today';
      } else if (d === yesterday) {
        title = 'Yesterday';
      } else {
        const parsed = new Date(d);
        if (!isNaN(parsed.getTime())) {
          title = parsed.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        }
      }

      sections.push({
        title,
        date: d,
        data: groups.get(d) || [],
      });
    });

    return sections;
  }, [transactions]);

  const hasActiveFilters =
    !!searchQuery || typeFilter !== 'all' || dateRangeFilter !== 'this_month' || selectedCategoryId !== null;

  const clearAllFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setDateRangeFilter('this_month');
    setSelectedCategoryId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Header Controls */}
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <View style={styles.headerControlsRow}>
          {/* View Toggle (List vs Insights) */}
          <View style={[styles.viewToggle, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab('transactions');
              }}
              style={[
                styles.viewToggleBtn,
                {
                  backgroundColor: activeTab === 'transactions' ? accent.primary : 'transparent',
                  borderRadius: radius.sm,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'transactions' }}
              accessibilityLabel="View transactions list"
            >
              <List size={16} color={activeTab === 'transactions' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: activeTab === 'transactions' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                ]}
              >
                Transactions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveTab('insights');
              }}
              style={[
                styles.viewToggleBtn,
                {
                  backgroundColor: activeTab === 'insights' ? accent.primary : 'transparent',
                  borderRadius: radius.sm,
                },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'insights' }}
              accessibilityLabel="View financial insights"
            >
              <PieChart size={16} color={activeTab === 'insights' ? '#FFFFFF' : colors.textSecondary} />
              <Text
                style={[
                  styles.viewToggleText,
                  { color: activeTab === 'insights' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                ]}
              >
                Insights
              </Text>
            </TouchableOpacity>
          </View>

          {/* Manage Categories Button */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsCategoryModalVisible(true);
            }}
            style={[styles.catBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
            accessibilityRole="button"
            accessibilityLabel="Manage Categories and Budgets"
          >
            <Settings size={16} color={accent.primary} />
            <Text style={[styles.catBtnText, { color: colors.textPrimary, fontSize: typography.xs }]}>
              Categories
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'transactions' && (
          <>
            {/* Search Input */}
            <Input
              placeholder="Search payee, notes, category..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={18} color={colors.textMuted} />}
              clearable
              containerStyle={{ marginTop: 8, marginBottom: 8 }}
            />

            {/* Filter Chips Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersScrollContent}
            >
              {/* Type Filter */}
              {(['all', 'expense', 'income'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setTypeFilter(t);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: typeFilter === t ? accent.primary : colors.bgSecondary,
                      borderColor: typeFilter === t ? accent.primary : colors.borderSubtle,
                      borderRadius: radius.full,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: typeFilter === t ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                    ]}
                  >
                    {t === 'all' ? 'All Types' : t === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Date Range Filter */}
              {(['this_month', 'last_month', 'this_year', 'all'] as const).map((dr) => (
                <TouchableOpacity
                  key={dr}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setDateRangeFilter(dr);
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: dateRangeFilter === dr ? colors.textPrimary : colors.bgSecondary,
                      borderColor: dateRangeFilter === dr ? colors.textPrimary : colors.borderSubtle,
                      borderRadius: radius.full,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: dateRangeFilter === dr ? colors.bgPrimary : colors.textSecondary,
                        fontSize: typography.xs,
                      },
                    ]}
                  >
                    {dr === 'this_month'
                      ? 'This Month'
                      : dr === 'last_month'
                      ? 'Last Month'
                      : dr === 'this_year'
                      ? 'This Year'
                      : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Category Filter Chips */}
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedCategoryId(isSelected ? null : cat.id);
                    }}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? cat.color : colors.bgSecondary,
                        borderColor: isSelected ? cat.color : colors.borderSubtle,
                        borderRadius: radius.full,
                      },
                    ]}
                    accessibilityRole="button"
                  >
                    <View style={[styles.catDot, { backgroundColor: isSelected ? '#FFFFFF' : cat.color }]} />
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: typography.xs },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Filters Clear Banner */}
            {hasActiveFilters && (
              <View style={styles.activeFilterRow}>
                <Text style={{ color: colors.textTertiary, fontSize: typography.xs }}>
                  Filtered ({transactions.length} found)
                </Text>
                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={styles.clearBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all filters"
                >
                  <X size={14} color={accent.primary} />
                  <Text style={[styles.clearBtnText, { color: accent.primary, fontSize: typography.xs }]}>
                    Reset filters
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Main Content Area */}
      {activeTab === 'insights' ? (
        <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <InsightsPanel
            onSelectCategory={(cId) => {
              setSelectedCategoryId(cId);
              setActiveTab('transactions');
            }}
          />
        </View>
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 110 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accent.primary}
            />
          }
          ListHeaderComponent={
            budgetOverview.length > 0 ? (
              <View style={styles.budgetHeader}>
                <Text
                  style={[
                    styles.budgetTitle,
                    { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.xs },
                  ]}
                >
                  MONTHLY BUDGET TRACKING
                </Text>
                {budgetOverview.map((item) => (
                  <BudgetProgressBar
                    key={item.categoryId}
                    item={item}
                    onPress={(cId) => {
                      setSelectedCategoryId(cId);
                    }}
                  />
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              icon={<Wallet size={48} color={accent.primary} />}
              title={hasActiveFilters ? 'No Matching Records' : 'No Transactions Yet'}
              description={
                hasActiveFilters
                  ? 'Try clearing active filters or adjusting search terms.'
                  : 'Start tracking your daily expenses, monthly salary, and budget progress.'
              }
              actionTitle={hasActiveFilters ? 'Clear Filters' : 'Add First Transaction'}
              onActionPress={hasActiveFilters ? clearAllFilters : () => setIsAddModalVisible(true)}
              style={{ marginTop: 40 }}
            />
          }
          renderSectionHeader={({ section: { title, data } }) => {
            const dayTotal = data.reduce(
              (acc, tx) => acc + (tx.type === 'income' ? tx.amount : -tx.amount),
              0
            );
            return (
              <View style={[styles.sectionHeaderBox, { backgroundColor: colors.bgPrimary }]}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                  {title}
                </Text>
                <Text
                  style={[
                    styles.sectionTotal,
                    { color: dayTotal >= 0 ? colors.success : colors.textTertiary, fontSize: typography.xs },
                  ]}
                >
                  {dayTotal >= 0 ? '+' : ''}₱{dayTotal.toLocaleString()}
                </Text>
              </View>
            );
          }}
          renderItem={({ item, index, section }) => (
            <Card variant="outlined" style={styles.txCard}>
              <TransactionRow
                transaction={item}
                borderBottom={false}
                onPress={() => setEditingTransaction(item)}
                onEdit={() => setEditingTransaction(item)}
                onDuplicate={() => handleDuplicate(item)}
                onDelete={() => handleDelete(item)}
              />
            </Card>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setIsAddModalVisible(true);
        }}
        accessibilityLabel="Add new transaction"
      />

      {/* 1. Add Transaction Modal */}
      <Modal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        title="Log Transaction"
        subtitle="Record income or expense with category"
        variant="bottomSheet"
      >
        <TransactionForm
          onSave={handleCreateTransaction}
          onCancel={() => setIsAddModalVisible(false)}
          submitButtonTitle="Save Transaction"
        />
      </Modal>

      {/* 2. Edit Transaction Modal */}
      <Modal
        visible={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        title="Edit Transaction"
        subtitle="Update details, category, or note"
        variant="bottomSheet"
      >
        {editingTransaction && (
          <TransactionForm
            initialItem={editingTransaction}
            onSave={handleUpdateTransaction}
            onCancel={() => setEditingTransaction(null)}
            submitButtonTitle="Save Changes"
          />
        )}
      </Modal>

      {/* 3. Category Manager Modal */}
      <CategoryManagerModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onCategoriesChanged={() => loadLedgerData()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingBottom: 4,
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    padding: 3,
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
  },
  viewToggleText: {
    fontWeight: '700',
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  catBtnText: {
    fontWeight: '600',
  },
  filtersScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: '600',
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearBtnText: {
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 4,
  },
  budgetHeader: {
    marginBottom: 12,
  },
  budgetTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionHeaderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionTotal: {
    fontWeight: '600',
  },
  txCard: {
    padding: 10,
    marginBottom: 8,
  },
});

export default LedgerScreen;
