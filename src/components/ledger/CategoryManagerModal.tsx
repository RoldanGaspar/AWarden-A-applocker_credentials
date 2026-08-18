/**
 * Life OS & Vault - Category Manager Modal
 * Allows creating, editing, and safely deleting Income & Expense categories with monthly budget limits
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
  Trash2,
  Edit2,
  Check,
  X,
  Briefcase,
  DollarSign,
  TrendingUp,
  Wallet,
  Utensils,
  Home,
  Zap,
  Car,
  ShoppingBag,
  HeartPulse,
  Sparkles,
  Coffee,
  BookOpen,
  Music,
  Film,
  Plane,
  Shield,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Modal, Button, Input, Card, Tag } from '../ui';
import { dbService } from '../../services/db';
import { Category, TransactionType } from '../../types/models';

export interface CategoryManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

const CATEGORY_COLORS = [
  '#16A34A', // Green
  '#0284C7', // Sky Blue
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#DC2626', // Red
  '#D97706', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#64748B', // Slate
];

const PRESET_ICONS = [
  'Briefcase',
  'DollarSign',
  'TrendingUp',
  'Wallet',
  'Utensils',
  'Home',
  'Zap',
  'Car',
  'ShoppingBag',
  'HeartPulse',
  'Sparkles',
  'Coffee',
  'BookOpen',
  'Music',
  'Film',
  'Plane',
  'Shield',
];

export const renderCategoryIconHelper = (iconName: string, color: string, size = 18) => {
  switch (iconName) {
    case 'Briefcase':
      return <Briefcase size={size} color={color} />;
    case 'DollarSign':
      return <DollarSign size={size} color={color} />;
    case 'TrendingUp':
      return <TrendingUp size={size} color={color} />;
    case 'Utensils':
      return <Utensils size={size} color={color} />;
    case 'Home':
      return <Home size={size} color={color} />;
    case 'Zap':
      return <Zap size={size} color={color} />;
    case 'Car':
      return <Car size={size} color={color} />;
    case 'ShoppingBag':
      return <ShoppingBag size={size} color={color} />;
    case 'HeartPulse':
      return <HeartPulse size={size} color={color} />;
    case 'Sparkles':
      return <Sparkles size={size} color={color} />;
    case 'Coffee':
      return <Coffee size={size} color={color} />;
    case 'BookOpen':
      return <BookOpen size={size} color={color} />;
    case 'Music':
      return <Music size={size} color={color} />;
    case 'Film':
      return <Film size={size} color={color} />;
    case 'Plane':
      return <Plane size={size} color={color} />;
    case 'Shield':
      return <Shield size={size} color={color} />;
    default:
      return <Wallet size={size} color={color} />;
  }
};

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  visible,
  onClose,
  onCategoriesChanged,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');

  // Form states
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [selectedIcon, setSelectedIcon] = useState('ShoppingBag');
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [error, setError] = useState('');

  const loadCategories = async () => {
    try {
      const data = await dbService.getCategories();
      setCategories(data);
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCategories();
      setIsFormVisible(false);
      setEditingCatId(null);
      setError('');
    }
  }, [visible]);

  const handleStartCreate = () => {
    setIsFormVisible(true);
    setEditingCatId(null);
    setName('');
    setType(activeTab);
    setSelectedIcon(activeTab === 'income' ? 'DollarSign' : 'ShoppingBag');
    setSelectedColor(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]);
    setBudgetLimit('');
    setError('');
  };

  const handleStartEdit = (cat: Category) => {
    setIsFormVisible(true);
    setEditingCatId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setSelectedIcon(cat.icon);
    setSelectedColor(cat.color);
    setBudgetLimit(cat.monthly_budget_limit ? String(cat.monthly_budget_limit) : '');
    setError('');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a category name');
      return;
    }

    const parsedLimit = budgetLimit.trim() ? parseFloat(budgetLimit) : null;
    if (budgetLimit.trim() && (isNaN(parsedLimit!) || parsedLimit! < 0)) {
      setError('Please enter a valid positive budget limit');
      return;
    }

    try {
      if (editingCatId) {
        await dbService.updateCategory({
          id: editingCatId,
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
          monthly_budget_limit: type === 'expense' ? parsedLimit : null,
        });
      } else {
        await dbService.createCategory({
          id: `cat_${Date.now()}`,
          name: name.trim(),
          type,
          icon: selectedIcon,
          color: selectedColor,
          monthly_budget_limit: type === 'expense' ? parsedLimit : null,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setIsFormVisible(false);
      setEditingCatId(null);
      await loadCategories();
      onCategoriesChanged();
    } catch (e: any) {
      setError(e?.message || 'Failed to save category');
    }
  };

  const handleDelete = (cat: Category) => {
    Alert.alert(
      'Delete Category?',
      `Are you sure you want to delete "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const res = await dbService.deleteCategory(cat.id);
            if (!res.success) {
              Alert.alert('Cannot Delete Category', res.error);
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              await loadCategories();
              onCategoriesChanged();
            }
          },
        },
      ]
    );
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Manage Categories"
      subtitle="Organize income sources & expense budget limits"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {isFormVisible ? (
          <Card variant="outlined" style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                {editingCatId ? 'Edit Category' : 'Create Category'}
              </Text>
              <TouchableOpacity
                onPress={() => setIsFormVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing category"
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Type toggle */}
            <View style={styles.typeToggleRow}>
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setType(t)}
                  style={[
                    styles.typeBtn,
                    {
                      backgroundColor: type === t ? (t === 'income' ? colors.successBg : colors.dangerBg) : colors.bgSecondary,
                      borderColor: type === t ? (t === 'income' ? colors.success : colors.danger) : colors.borderSubtle,
                      borderRadius: radius.md,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: type === t ? (t === 'income' ? colors.success : colors.danger) : colors.textSecondary, fontSize: typography.sm },
                    ]}
                  >
                    {t === 'income' ? 'Income Category' : 'Expense Category'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Category Name *"
              placeholder="e.g. Groceries, Gym, Dividends"
              value={name}
              onChangeText={setName}
            />

            {type === 'expense' && (
              <Input
                label="Monthly Budget Limit (₱ Optional)"
                placeholder="e.g. 15000"
                keyboardType="decimal-pad"
                value={budgetLimit}
                onChangeText={setBudgetLimit}
              />
            )}

            {/* Icon selection */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
              Category Icon
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {PRESET_ICONS.map((iconName) => (
                <TouchableOpacity
                  key={iconName}
                  onPress={() => setSelectedIcon(iconName)}
                  style={[
                    styles.iconPickerItem,
                    {
                      backgroundColor: selectedIcon === iconName ? accent.primaryBgLight : colors.bgSecondary,
                      borderColor: selectedIcon === iconName ? accent.primary : colors.borderSubtle,
                      borderRadius: radius.md,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select icon ${iconName}`}
                >
                  {renderCategoryIconHelper(iconName, selectedIcon === iconName ? accent.primary : colors.textSecondary, 20)}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Color selection */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
              Category Color
            </Text>
            <View style={styles.colorGrid}>
              {CATEGORY_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c, borderColor: selectedColor === c ? '#FFFFFF' : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${c}`}
                >
                  {selectedColor === c && <Check size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={{ color: colors.danger, fontSize: typography.xs, marginTop: 8 }}>{error}</Text> : null}

            <Button
              title={editingCatId ? 'Save Changes' : 'Create Category'}
              onPress={handleSave}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <>
            {/* Tab switch */}
            <View style={styles.tabRow}>
              {(['expense', 'income'] as TransactionType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setActiveTab(t);
                  }}
                  style={[
                    styles.tabBtn,
                    {
                      backgroundColor: activeTab === t ? accent.primary : colors.bgSecondary,
                      borderRadius: radius.md,
                    },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === t }}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      { color: activeTab === t ? '#FFFFFF' : colors.textSecondary, fontSize: typography.sm },
                    ]}
                  >
                    {t === 'expense' ? 'Expenses' : 'Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={`Add ${activeTab === 'expense' ? 'Expense' : 'Income'} Category`}
              iconLeft={<Plus size={18} color="#FFFFFF" />}
              onPress={handleStartCreate}
              variant="primary"
              fullWidth
              style={{ marginBottom: spacing.md }}
            />

            <ScrollView style={{ maxHeight: 320 }}>
              {filteredCategories.map((cat) => (
                <View
                  key={cat.id}
                  style={[
                    styles.categoryRow,
                    {
                      borderBottomColor: colors.borderSubtle,
                      borderBottomWidth: 1,
                      minHeight: spacing.minTouchTarget,
                    },
                  ]}
                >
                  <View style={[styles.catIconBox, { backgroundColor: cat.color, borderRadius: radius.md }]}>
                    {renderCategoryIconHelper(cat.icon, '#FFFFFF', 18)}
                  </View>

                  <View style={styles.catInfo}>
                    <Text style={[styles.catName, { color: colors.textPrimary, fontSize: typography.base }]}>
                      {cat.name}
                    </Text>
                    {cat.monthly_budget_limit ? (
                      <Text style={[styles.catBudget, { color: colors.textTertiary, fontSize: typography.xs }]}>
                        Monthly Budget: ₱{cat.monthly_budget_limit.toLocaleString()}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.rowActions}>
                    <TouchableOpacity
                      onPress={() => handleStartEdit(cat)}
                      style={[styles.actionBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit category ${cat.name}`}
                    >
                      <Edit2 size={16} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(cat)}
                      style={[styles.actionBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete category ${cat.name}`}
                    >
                      <Trash2 size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontWeight: '700',
  },
  formCard: {
    padding: 16,
    marginBottom: 12,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  formTitle: {
    fontWeight: '700',
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontWeight: '700',
  },
  fieldLabel: {
    fontWeight: '600',
  },
  iconPickerItem: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  catIconBox: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catInfo: {
    flex: 1,
  },
  catName: {
    fontWeight: '600',
  },
  catBudget: {
    marginTop: 2,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
});
