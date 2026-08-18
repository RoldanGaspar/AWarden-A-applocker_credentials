/**
 * Life OS & Vault - Reusable Transaction Form Component
 * Used for logging income and expenses with multi-currency support and encrypted notes
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
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  DollarSign,
  Repeat,
  Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Input, Button, Switch, Tag, Card } from '../ui';
import { renderCategoryIconHelper } from './CategoryManagerModal';
import { dbService } from '../../services/db';
import {
  Transaction,
  TransactionType,
  Category,
  CURRENCIES,
  CurrencyCode,
} from '../../types/models';

export interface TransactionFormProps {
  initialItem?: Transaction | null;
  defaultType?: TransactionType;
  onSave: (item: Omit<Transaction, 'created_at'>) => Promise<void>;
  onCancel: () => void;
  submitButtonTitle?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialItem,
  defaultType = 'expense',
  onSave,
  onCancel,
  submitButtonTitle = 'Save Transaction',
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [type, setType] = useState<TransactionType>(initialItem?.type || defaultType);
  const [amount, setAmount] = useState(initialItem ? String(initialItem.amount) : '');
  const [currency, setCurrency] = useState<string>(initialItem?.currency || 'PHP');
  const [categoryId, setCategoryId] = useState<string>(initialItem?.category_id || '');
  const [date, setDate] = useState<string>(
    initialItem?.date || new Date().toISOString().split('T')[0]
  );
  const [payee, setPayee] = useState(initialItem?.payee_or_source || '');
  const [note, setNote] = useState(initialItem?.note || '');
  const [isRecurring, setIsRecurring] = useState(initialItem?.is_recurring || false);
  const [recurringFreq, setRecurringFreq] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>(
    initialItem?.recurring_frequency || 'monthly'
  );

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await dbService.getCategories();
      setCategories(data);
      if (!categoryId) {
        const defaultCat = data.find((c) => c.type === type);
        if (defaultCat) setCategoryId(defaultCat.id);
      }
    } catch (e) {
      console.warn('Failed to load categories:', e);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const defaultCat = categories.find((c) => c.type === newType);
    if (defaultCat) setCategoryId(defaultCat.id);
    Haptics.selectionAsync().catch(() => {});
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (!payee.trim()) {
      setError(type === 'expense' ? 'Please enter a payee or description' : 'Please enter an income source');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        id: initialItem?.id || `tx_${Date.now()}`,
        type,
        amount: parsedAmount,
        currency,
        category_id: categoryId,
        date: date.trim() || new Date().toISOString().split('T')[0],
        payee_or_source: payee.trim(),
        note: note.trim() || null,
        is_recurring: isRecurring,
        recurring_frequency: isRecurring ? recurringFreq : null,
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  return (
    <View style={styles.container}>
      {/* Type Toggle */}
      <View style={styles.typeRow}>
        <TouchableOpacity
          onPress={() => handleTypeChange('expense')}
          style={[
            styles.typeBtn,
            {
              backgroundColor: type === 'expense' ? colors.dangerBg : colors.bgSecondary,
              borderColor: type === 'expense' ? colors.danger : colors.borderSubtle,
              borderRadius: radius.md,
            },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: type === 'expense' }}
        >
          <ArrowUpRight size={18} color={type === 'expense' ? colors.danger : colors.textSecondary} />
          <Text
            style={[
              styles.typeBtnText,
              { color: type === 'expense' ? colors.danger : colors.textSecondary, fontSize: typography.sm },
            ]}
          >
            Expense
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleTypeChange('income')}
          style={[
            styles.typeBtn,
            {
              backgroundColor: type === 'income' ? colors.successBg : colors.bgSecondary,
              borderColor: type === 'income' ? colors.success : colors.borderSubtle,
              borderRadius: radius.md,
            },
          ]}
          accessibilityRole="tab"
          accessibilityState={{ selected: type === 'income' }}
        >
          <ArrowDownLeft size={18} color={type === 'income' ? colors.success : colors.textSecondary} />
          <Text
            style={[
              styles.typeBtnText,
              { color: type === 'income' ? colors.success : colors.textSecondary, fontSize: typography.sm },
            ]}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount & Currency */}
      <View style={styles.amountCurrencyRow}>
        <View style={{ flex: 2, marginRight: spacing.sm }}>
          <Input
            label="Amount *"
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus={!initialItem}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
            Currency
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => {
                  setCurrency(c.code);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={[
                  styles.currencyPill,
                  {
                    backgroundColor: currency === c.code ? accent.primary : colors.bgSecondary,
                    borderColor: currency === c.code ? accent.primary : colors.borderSubtle,
                    borderRadius: radius.md,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={c.label}
              >
                <Text
                  style={[
                    styles.currencyPillText,
                    { color: currency === c.code ? '#FFFFFF' : colors.textPrimary, fontSize: typography.xs },
                  ]}
                >
                  {c.code} {c.symbol}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Payee / Source */}
      <Input
        label={type === 'expense' ? 'Payee / Description *' : 'Income Source / Client *'}
        placeholder={type === 'expense' ? 'e.g. Supermarket, Coffee Shop, Landlord' : 'e.g. Monthly Salary, Freelance Work'}
        value={payee}
        onChangeText={setPayee}
      />

      {/* Category Selection Chips */}
      <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
        Category *
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {filteredCategories.map((cat) => {
          const isSelected = categoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => {
                setCategoryId(cat.id);
                Haptics.selectionAsync().catch(() => {});
              }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected ? cat.color : colors.bgSecondary,
                  borderColor: isSelected ? cat.color : colors.borderSubtle,
                  borderRadius: radius.full,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Select category ${cat.name}`}
            >
              <View style={{ marginRight: 6 }}>
                {renderCategoryIconHelper(cat.icon, isSelected ? '#FFFFFF' : cat.color, 16)}
              </View>
              <Text
                style={[
                  styles.categoryChipText,
                  { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: typography.xs },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date */}
      <Input
        label="Date (YYYY-MM-DD)"
        placeholder="2026-08-17"
        value={date}
        onChangeText={setDate}
      />

      {/* Recurring switch */}
      <View style={[styles.recurringBox, { backgroundColor: colors.bgSecondary, borderRadius: radius.md, marginBottom: 12 }]}>
        <Switch
          label="Recurring Transaction"
          subtitle="Mark this transaction as repeating"
          value={isRecurring}
          onValueChange={setIsRecurring}
        />

        {isRecurring && (
          <View style={styles.freqRow}>
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((freq) => (
              <TouchableOpacity
                key={freq}
                onPress={() => {
                  setRecurringFreq(freq);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={[
                  styles.freqPill,
                  {
                    backgroundColor: recurringFreq === freq ? accent.primary : colors.bgTertiary,
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.freqPillText,
                    { color: recurringFreq === freq ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Encrypted Note */}
      <Input
        label="Encrypted Note (Optional)"
        placeholder="Receipt details, tax notes, or warranty info (AES-256 encrypted)"
        value={note}
        onChangeText={setNote}
        multiline
        numberOfLines={2}
        inputStyle={{ height: 60, textAlignVertical: 'top' }}
        errorText={error}
      />

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Button
          title="Cancel"
          variant="secondary"
          onPress={onCancel}
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title={submitButtonTitle}
          variant="primary"
          onPress={handleSubmit}
          loading={isSubmitting}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    gap: 6,
  },
  typeBtnText: {
    fontWeight: '700',
  },
  amountCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fieldLabel: {
    fontWeight: '600',
  },
  currencyPill: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyPillText: {
    fontWeight: '700',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontWeight: '600',
  },
  recurringBox: {
    padding: 12,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  freqPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqPillText: {
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
});
