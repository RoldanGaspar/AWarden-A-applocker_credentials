/**
 * Life OS & Vault - Quick Actions Bottom Sheet & Creation Forms
 * Enables rapid creation of expenses, income, passwords, safe notes, and tasks directly from Dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowLeft,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button, Input, Card, Tag, Switch } from '../ui';
import { CredentialForm } from '../vault/CredentialForm';
import { TransactionForm } from '../ledger/TransactionForm';
import { TaskForm } from '../tasks/TaskForm';
import { dbService } from '../../services/db';
import { Category, TransactionType, TaskPriority } from '../../types/models';

export type QuickActionType = 'menu' | 'expense' | 'income' | 'vault' | 'note' | 'task';

export interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onDataCreated: () => void;
  initialAction?: QuickActionType;
}

export const QuickActionsModal: React.FC<QuickActionsModalProps> = ({
  visible,
  onClose,
  onDataCreated,
  initialAction = 'menu',
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [activeView, setActiveView] = useState<QuickActionType>(initialAction);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Transaction form state
  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [categoryId, setCategoryId] = useState('cat_food');
  const [transactionNote, setTransactionNote] = useState('');

  // Vault Item form state
  const [vaultTitle, setVaultTitle] = useState('');
  const [vaultUsername, setVaultUsername] = useState('');
  const [vaultPassword, setVaultPassword] = useState('');
  const [vaultUrl, setVaultUrl] = useState('');
  const [vaultNotes, setVaultNotes] = useState('');
  const [vaultFavorite, setVaultFavorite] = useState(false);

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [notePinned, setNotePinned] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');

  useEffect(() => {
    if (visible) {
      setActiveView(initialAction);
      resetForms();
      loadCategories();
    }
  }, [visible, initialAction]);

  const loadCategories = async () => {
    try {
      const cats = await dbService.getCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  const resetForms = () => {
    setError('');
    setAmount('');
    setPayee('');
    setTransactionNote('');
    setVaultTitle('');
    setVaultUsername('');
    setVaultPassword('');
    setVaultUrl('');
    setVaultNotes('');
    setVaultFavorite(false);
    setNoteTitle('');
    setNoteContent('');
    setNotePinned(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('medium');
    setTaskDueDate(new Date().toISOString().split('T')[0]);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*()_+';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVaultPassword(pwd);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSaveTransaction = async (type: TransactionType) => {
    if (!masterKey) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }
    if (!payee.trim()) {
      setError('Please enter a payee, client, or description');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const today = new Date().toISOString().split('T')[0];
      await dbService.createTransaction(
        {
          id: `tx_${Date.now()}`,
          type,
          amount: parsedAmount,
          currency: 'PHP',
          category_id: categoryId || (type === 'income' ? 'cat_salary' : 'cat_food'),
          date: today,
          payee_or_source: payee.trim(),
          note: transactionNote.trim() || null,
          is_recurring: false,
          recurring_frequency: null,
        },
        masterKey
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDataCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVaultItem = async () => {
    if (!masterKey) return;
    if (!vaultTitle.trim()) {
      setError('Please enter a title or service name');
      return;
    }
    if (!vaultPassword) {
      setError('Please enter or generate a password');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await dbService.createVaultItem(
        {
          id: `item_${Date.now()}`,
          folder_id: 'folder_personal_vault',
          title: vaultTitle.trim(),
          username: vaultUsername.trim(),
          password: vaultPassword,
          url: vaultUrl.trim() || null,
          notes: vaultNotes.trim() || null,
          tags: ['QuickAdd'],
          is_favorite: vaultFavorite,
        },
        masterKey
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDataCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to store password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNote = async () => {
    if (!masterKey) return;
    if (!noteTitle.trim()) {
      setError('Please enter a note title');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await dbService.createNote(
        {
          id: `note_${Date.now()}`,
          folder_id: 'folder_personal_notes',
          title: noteTitle.trim(),
          content: noteContent.trim(),
          is_pinned: notePinned,
          is_favorite: false,
          tags: ['QuickNote'],
        },
        masterKey
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDataCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTask = async () => {
    if (!masterKey) return;
    if (!taskTitle.trim()) {
      setError('Please enter a task title');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await dbService.createTask(
        {
          id: `task_${Date.now()}`,
          title: taskTitle.trim(),
          description: taskDesc.trim() || null,
          status: 'todo',
          priority: taskPriority,
          due_date: taskDueDate || null,
          completed_at: null,
          tags: ['QuickTask'],
        },
        masterKey
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDataCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'menu':
        return (
          <View style={styles.menuContainer}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveView('expense');
              }}
              style={[styles.menuItem, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
              accessibilityRole="button"
              accessibilityLabel="Add Expense"
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.dangerBg }]}>
                <ArrowUpRight size={22} color={colors.danger} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                  Log Expense
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Record daily spending & budget category
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveView('income');
              }}
              style={[styles.menuItem, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
              accessibilityRole="button"
              accessibilityLabel="Add Income"
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.successBg }]}>
                <ArrowDownLeft size={22} color={colors.success} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                  Log Income
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Record salary, freelance, or earnings
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveView('vault');
              }}
              style={[styles.menuItem, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
              accessibilityRole="button"
              accessibilityLabel="Add Password"
            >
              <View style={[styles.menuIcon, { backgroundColor: accent.primaryBgLight }]}>
                <KeyRound size={22} color={accent.primary} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                  Store Credential
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Save encrypted account credentials & notes
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveView('note');
              }}
              style={[styles.menuItem, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
              accessibilityRole="button"
              accessibilityLabel="Add Note"
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.infoBg }]}>
                <FileText size={22} color={colors.info} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                  Safe Markdown Note
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Write encrypted idea or journal
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveView('task');
              }}
              style={[styles.menuItem, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
              accessibilityRole="button"
              accessibilityLabel="Add Task"
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.warningBg }]}>
                <CheckSquare size={22} color={colors.warning} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                  Create Task
                </Text>
                <Text style={[styles.menuSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Set priority & deadline in workflow
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );

      case 'expense':
      case 'income':
        const isExpense = activeView === 'expense';
        return (
          <View>
            <TouchableOpacity
              onPress={() => setActiveView('menu')}
              style={styles.backLink}
              accessibilityRole="button"
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backLinkText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                Back to Quick Actions
              </Text>
            </TouchableOpacity>

            <TransactionForm
              defaultType={isExpense ? 'expense' : 'income'}
              onSave={async (item) => {
                if (!masterKey) return;
                await dbService.createTransaction(item, masterKey);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                onDataCreated();
                onClose();
              }}
              onCancel={() => setActiveView('menu')}
              submitButtonTitle={isExpense ? 'Save Expense' : 'Save Income'}
            />
          </View>
        );

      case 'vault':
        return (
          <View>
            <TouchableOpacity
              onPress={() => setActiveView('menu')}
              style={styles.backLink}
              accessibilityRole="button"
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backLinkText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                Back to Quick Actions
              </Text>
            </TouchableOpacity>

            <CredentialForm
              onSave={async (item) => {
                if (!masterKey) return;
                await dbService.createVaultItem(item, masterKey);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                onDataCreated();
                onClose();
              }}
              onCancel={() => setActiveView('menu')}
              submitButtonTitle="Store Credential"
            />
          </View>
        );

      case 'note':
        return (
          <View>
            <TouchableOpacity
              onPress={() => setActiveView('menu')}
              style={styles.backLink}
              accessibilityRole="button"
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backLinkText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                Back to Quick Actions
              </Text>
            </TouchableOpacity>

            <Input
              label="Note Title"
              placeholder="e.g. Project Architecture, Journal"
              value={noteTitle}
              onChangeText={setNoteTitle}
            />

            <Input
              label="Markdown Content"
              placeholder="Type your notes (supports markdown formatting)..."
              value={noteContent}
              onChangeText={setNoteContent}
              multiline
              numberOfLines={4}
              inputStyle={{ height: 100, textAlignVertical: 'top' }}
              errorText={error}
            />

            <View style={{ marginBottom: 16 }}>
              <Switch
                label="Pin to Top"
                subtitle="Keep this note at the top of your list"
                value={notePinned}
                onValueChange={setNotePinned}
              />
            </View>

            <Button
              title="Save Encrypted Note"
              onPress={handleSaveNote}
              loading={isSaving}
              variant="primary"
              fullWidth
            />
          </View>
        );

      case 'task':
        return (
          <View>
            <TouchableOpacity
              onPress={() => setActiveView('menu')}
              style={styles.backLink}
              accessibilityRole="button"
            >
              <ArrowLeft size={16} color={colors.textSecondary} />
              <Text style={[styles.backLinkText, { color: colors.textSecondary, fontSize: typography.sm }]}>
                Back to Quick Actions
              </Text>
            </TouchableOpacity>

            <TaskForm
              onSave={async (item) => {
                if (!masterKey) return;
                await dbService.createTask(item, masterKey);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                onDataCreated();
                onClose();
              }}
              onCancel={() => setActiveView('menu')}
              submitButtonTitle="Create Task"
            />
          </View>
        );
    }
  };

  const getModalTitle = () => {
    switch (activeView) {
      case 'expense':
        return 'Log Expense';
      case 'income':
        return 'Log Income';
      case 'vault':
        return 'Store Password';
      case 'note':
        return 'New Safe Note';
      case 'task':
        return 'New Task';
      default:
        return 'Quick Actions';
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={getModalTitle()}
      subtitle="Local-first encrypted entry"
      variant="bottomSheet"
    >
      {renderContent()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    paddingVertical: 8,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 64,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '700',
  },
  menuSub: {
    marginTop: 2,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  backLinkText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  formLabel: {
    fontWeight: '600',
  },
  pwdRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  generateBtn: {
    width: 48,
    height: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginTop: 24,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
});
