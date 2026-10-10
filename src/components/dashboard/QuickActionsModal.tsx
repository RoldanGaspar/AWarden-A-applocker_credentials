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
} from 'react-native';
import {
  ArrowUpRight,
  ArrowDownLeft,
  KeyRound,
  FileText,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button, Input, Switch } from '../ui';
import { CredentialForm } from '../vault/CredentialForm';
import { TransactionForm } from '../ledger/TransactionForm';
import { TaskForm } from '../tasks/TaskForm';
import { dbService } from '../../services/db';
import { Category, TransactionType, TaskPriority } from '../../types/models';

export type QuickActionType = 'menu' | 'expense' | 'income' | 'vault' | 'note' | 'task';

type CapturableAction = Exclude<QuickActionType, 'menu'>;

interface QuickActionOption {
  action: CapturableAction;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: 'danger' | 'success' | 'accent' | 'info' | 'warning';
}

const QUICK_ACTION_OPTIONS: QuickActionOption[] = [
  {
    action: 'expense',
    title: 'Expense',
    subtitle: 'Track spending',
    icon: ArrowUpRight,
    tone: 'danger',
  },
  {
    action: 'income',
    title: 'Income',
    subtitle: 'Add earnings',
    icon: ArrowDownLeft,
    tone: 'success',
  },
  {
    action: 'vault',
    title: 'Credential',
    subtitle: 'Protect a login',
    icon: KeyRound,
    tone: 'accent',
  },
  {
    action: 'note',
    title: 'Safe note',
    subtitle: 'Capture an idea',
    icon: FileText,
    tone: 'info',
  },
  {
    action: 'task',
    title: 'Task',
    subtitle: 'Plan your next step',
    icon: CheckSquare,
    tone: 'warning',
  },
];

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
  const { colors, accent, spacing, typography, radius, isDark } = useTheme();
  const { masterKey } = useAuth();

  const [activeView, setActiveView] = useState<QuickActionType>(initialAction);
  const [lastAction, setLastAction] = useState<CapturableAction | null>(null);
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

  const selectAction = (action: CapturableAction) => {
    Haptics.selectionAsync().catch(() => {});
    setLastAction(action);
    setActiveView(action);
  };

  const lastActionOption = lastAction
    ? QUICK_ACTION_OPTIONS.find((option) => option.action === lastAction)
    : undefined;
  const LastActionIcon = lastActionOption?.icon;

  const renderContent = () => {
    switch (activeView) {
      case 'menu':
        return (
          <View style={styles.menuContainer}>
            <View
              style={[
                styles.menuIntro,
                {
                  backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight,
                  borderColor: accent.primary,
                  borderRadius: radius.xl,
                },
              ]}
            >
              <View
                style={[
                  styles.menuIntroIcon,
                  { backgroundColor: accent.primary, borderRadius: radius.md },
                ]}
              >
                <Sparkles size={18} color={accent.contrastText} />
              </View>
              <View style={styles.menuIntroText}>
                <Text style={[styles.menuIntroTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                  Capture it while it’s fresh
                </Text>
                <Text style={[styles.menuIntroSub, { color: colors.textSecondary, fontSize: typography.xs }]}>
                  One calm place for everything you want to remember.
                </Text>
              </View>
              <View
                style={[
                  styles.localChip,
                  {
                    backgroundColor: colors.bgElevated,
                    borderColor: colors.borderSubtle,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <ShieldCheck size={12} color={accent.primary} />
                <Text style={[styles.localChipText, { color: colors.textSecondary, fontSize: typography.xs }]}>ON DEVICE</Text>
              </View>
            </View>

            {lastActionOption && LastActionIcon && (
              <TouchableOpacity
                onPress={() => selectAction(lastActionOption.action)}
                style={[
                  styles.repeatCard,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: accent.primary,
                    borderRadius: radius.xl,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Repeat ${lastActionOption.title}`}
              >
                <View
                  style={[
                    styles.repeatIcon,
                    { backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight, borderRadius: radius.md },
                  ]}
                >
                  <LastActionIcon size={18} color={accent.primary} />
                </View>
                <View style={styles.repeatText}>
                  <Text style={[styles.repeatEyebrow, { color: accent.primary, fontSize: typography.xs }]}>QUICK REPEAT</Text>
                  <Text style={[styles.repeatTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>Open {lastActionOption.title}</Text>
                </View>
                <ChevronRight size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}

            <Text style={[styles.menuSectionLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>CREATE NEW</Text>

            <View style={styles.actionGrid}>
              {QUICK_ACTION_OPTIONS.map((option) => {
                const ActionIcon = option.icon;
                const palette = {
                  danger: { backgroundColor: colors.dangerBg, color: colors.danger },
                  success: { backgroundColor: colors.successBg, color: colors.success },
                  accent: {
                    backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight,
                    color: accent.primary,
                  },
                  info: { backgroundColor: colors.infoBg, color: colors.info },
                  warning: { backgroundColor: colors.warningBg, color: colors.warning },
                }[option.tone];

                return (
                  <TouchableOpacity
                    key={option.action}
                    onPress={() => selectAction(option.action)}
                    style={[
                      styles.actionTile,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: colors.borderSubtle,
                        borderRadius: radius.xl,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Capture ${option.title}`}
                  >
                    <View style={styles.actionTileTopRow}>
                      <View style={[styles.actionTileIcon, { backgroundColor: palette.backgroundColor, borderRadius: radius.md }]}>
                        <ActionIcon size={19} color={palette.color} />
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.actionTileTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.actionTileSub, { color: colors.textTertiary, fontSize: typography.xs }]}>
                      {option.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
        return 'Quick Capture';
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={getModalTitle()}
      subtitle="Private capture • encrypted on device"
      variant="bottomSheet"
    >
      {renderContent()}
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    paddingVertical: 4,
    gap: 12,
  },
  menuIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 76,
    borderWidth: 1,
  },
  menuIntroIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIntroText: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuIntroTitle: {
    fontWeight: '800',
  },
  menuIntroSub: {
    marginTop: 3,
    lineHeight: 16,
  },
  localChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
  },
  localChipText: {
    fontWeight: '800',
    letterSpacing: 0.4,
    marginLeft: 4,
  },
  repeatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 64,
    borderWidth: 1,
  },
  repeatIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatText: {
    flex: 1,
    marginHorizontal: 10,
  },
  repeatEyebrow: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  repeatTitle: {
    fontWeight: '700',
    marginTop: 2,
  },
  menuSectionLabel: {
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 2,
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionTile: {
    width: '48%',
    minHeight: 118,
    padding: 12,
    borderWidth: 1,
  },
  actionTileTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  actionTileIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileTitle: {
    fontWeight: '800',
    marginTop: 12,
  },
  actionTileSub: {
    marginTop: 3,
    lineHeight: 16,
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
});
