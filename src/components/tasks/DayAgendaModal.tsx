/**
 * Life OS & Vault - Day Agenda Bottom Sheet Modal
 * Unified day schedule displaying tasks due and financial transactions logged on that date
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Calendar,
  Plus,
  CheckCircle,
  Wallet,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button, Card, Tag } from '../ui';
import { TaskCard } from './TaskCard';
import { renderCategoryIconHelper } from '../ledger/CategoryManagerModal';
import { dbService } from '../../services/db';
import { Task, Transaction, TaskStatus } from '../../types/models';

export interface DayAgendaModalProps {
  visible: boolean;
  date: string | null; // YYYY-MM-DD
  onClose: () => void;
  onAddTaskForDate: (date: string) => void;
  onSelectTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDuplicateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const DayAgendaModal: React.FC<DayAgendaModalProps> = ({
  visible,
  date,
  onClose,
  onAddTaskForDate,
  onSelectTask,
  onEditTask,
  onStatusChange,
  onDuplicateTask,
  onDeleteTask,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && date && masterKey) {
      loadDayEvents(date);
    }
  }, [visible, date, masterKey]);

  const loadDayEvents = async (dateIso: string) => {
    if (!masterKey) return;
    setLoading(true);
    try {
      const agenda = await dbService.getDayAgenda(masterKey, dateIso);
      setTasks(agenda.tasks);
      setTransactions(agenda.transactions);
    } catch (e) {
      console.warn('Failed to load day agenda:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!date) return null;

  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Daily Schedule"
      subtitle={formattedDate}
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {/* Quick Task Injector Button */}
        <Button
          title="Add Task for this Day"
          iconLeft={<Plus size={16} color="#FFFFFF" />}
          onPress={() => {
            onClose();
            onAddTaskForDate(date);
          }}
          variant="primary"
          fullWidth
          style={{ marginBottom: spacing.md }}
        />

        <ScrollView style={{ maxHeight: 380 }}>
          {/* Section 1: Tasks Due */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.xs },
            ]}
          >
            TASKS DUE ({tasks.length})
          </Text>

          {tasks.length === 0 ? (
            <Card variant="outlined" style={[styles.emptyCard, { marginBottom: spacing.md }]}>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.xs }]}>
                No tasks scheduled for this day.
              </Text>
            </Card>
          ) : (
            <View style={{ marginBottom: spacing.md, gap: 8 }}>
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPress={() => {
                    onClose();
                    onSelectTask(task);
                  }}
                  onEdit={() => {
                    onClose();
                    onEditTask(task);
                  }}
                  onStatusChange={(newStatus) => {
                    onStatusChange(task.id, newStatus);
                    loadDayEvents(date);
                  }}
                  onDuplicate={() => {
                    onDuplicateTask(task);
                    loadDayEvents(date);
                  }}
                  onDelete={() => {
                    onDeleteTask(task.id);
                    loadDayEvents(date);
                  }}
                />
              ))}
            </View>
          )}

          {/* Section 2: Financial Transactions */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.xs },
            ]}
          >
            TRANSACTIONS ({transactions.length})
          </Text>

          {transactions.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textTertiary, fontSize: typography.xs }]}>
                No financial transactions logged on this day.
              </Text>
            </Card>
          ) : (
            <Card variant="outlined">
              {transactions.map((tx, idx) => {
                const isIncome = tx.type === 'income';
                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txRow,
                      {
                        borderBottomColor: colors.borderSubtle,
                        borderBottomWidth: idx < transactions.length - 1 ? 1 : 0,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.catIconBox,
                        {
                          backgroundColor: isIncome ? colors.successBg : colors.dangerBg,
                          borderRadius: radius.xs,
                        },
                      ]}
                    >
                      {renderCategoryIconHelper(
                        tx.categoryIcon || 'DollarSign',
                        isIncome ? colors.success : colors.danger,
                        16
                      )}
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={[styles.txPayee, { color: colors.textPrimary, fontSize: typography.sm }]}>
                        {tx.payee_or_source || 'Transaction'}
                      </Text>
                      <Text style={[styles.txCategory, { color: colors.textTertiary, fontSize: typography.xs }]}>
                        {tx.categoryName || 'General'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.txAmount,
                        { color: isIncome ? colors.success : colors.textPrimary, fontSize: typography.sm },
                      ]}
                    >
                      {isIncome ? '+' : '-'}₱{tx.amount.toLocaleString()}
                    </Text>
                  </View>
                );
              })}
            </Card>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  catIconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  txInfo: {
    flex: 1,
  },
  txPayee: {
    fontWeight: '600',
  },
  txCategory: {
    marginTop: 1,
  },
  txAmount: {
    fontWeight: '700',
  },
});
