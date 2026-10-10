import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChevronRight,
  FileText,
  KeyRound,
  ListChecks,
  NotebookPen,
  ReceiptText,
  Search,
  ShieldCheck,
  ShieldKeyhole,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Input, Modal } from '../ui';
import { dbService } from '../../services/db';
import { Note, Task, Transaction, VaultItem } from '../../types/models';

type SearchEntity = 'vault' | 'ledger' | 'notes' | 'tasks';
type SearchTone = 'accent' | 'success' | 'info' | 'warning';
type SearchRoute = '/(tabs)/vault' | '/(tabs)/ledger' | '/(tabs)/notes' | '/(tabs)/tasks';

interface GlobalSearchResult {
  id: string;
  entity: SearchEntity;
  title: string;
  subtitle: string;
  detail: string;
  icon: LucideIcon;
  tone: SearchTone;
  route: SearchRoute;
}

type SearchBuckets = Record<SearchEntity, GlobalSearchResult[]>;

export interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

const EMPTY_RESULTS: SearchBuckets = {
  vault: [],
  ledger: [],
  notes: [],
  tasks: [],
};

const ENTITY_ORDER: SearchEntity[] = ['vault', 'ledger', 'notes', 'tasks'];

const ENTITY_META: Record<SearchEntity, { label: string; icon: LucideIcon; tone: SearchTone }> = {
  vault: { label: 'Vault', icon: ShieldKeyhole, tone: 'accent' },
  ledger: { label: 'Ledger', icon: ReceiptText, tone: 'success' },
  notes: { label: 'Safe Notes', icon: NotebookPen, tone: 'info' },
  tasks: { label: 'Tasks', icon: ListChecks, tone: 'warning' },
};

const truncate = (value: string | null | undefined, maxLength = 76): string => {
  const cleanValue = (value || '').replace(/\s+/g, ' ').trim();
  if (!cleanValue) return '';
  return cleanValue.length > maxLength ? `${cleanValue.slice(0, maxLength - 1)}…` : cleanValue;
};

const formatDate = (value: string | number | null | undefined): string => {
  if (!value) return '';
  const date = typeof value === 'number' ? new Date(value) : new Date(`${value}T00:00:00`);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const mapSearchResults = (
  vaultItems: VaultItem[],
  transactions: Transaction[],
  notes: Note[],
  tasks: Task[]
): SearchBuckets => ({
  vault: vaultItems.slice(0, 4).map((item) => ({
    id: item.id,
    entity: 'vault',
    title: item.title,
    subtitle: item.username ? `••••${item.username.slice(-3)} · Credential` : 'Encrypted credential',
    detail: item.tags.length ? item.tags.slice(0, 2).join(' · ') : 'Protected locally',
    icon: KeyRound,
    tone: 'accent',
    route: '/(tabs)/vault',
  })),
  ledger: transactions.slice(0, 4).map((item) => ({
    id: item.id,
    entity: 'ledger',
    title: item.payee_or_source || 'Ledger entry',
    subtitle: `${item.type === 'income' ? 'Income' : 'Expense'} · ${item.currency || 'PHP'} ${item.amount.toLocaleString()}`,
    detail: [item.categoryName, formatDate(item.date)].filter(Boolean).join(' · '),
    icon: ReceiptText,
    tone: 'success',
    route: '/(tabs)/ledger',
  })),
  notes: notes.slice(0, 4).map((item) => ({
    id: item.id,
    entity: 'notes',
    title: item.title,
    subtitle: `Safe note${item.is_pinned ? ' · Pinned' : ''}`,
    detail: truncate(item.content) || `Updated ${formatDate(item.updated_at)}`,
    icon: FileText,
    tone: 'info',
    route: '/(tabs)/notes',
  })),
  tasks: tasks.slice(0, 4).map((item) => ({
    id: item.id,
    entity: 'tasks',
    title: item.title,
    subtitle: `${item.status === 'in_progress' ? 'In progress' : 'To do'} · ${item.priority} priority`,
    detail: item.due_date ? `Due ${formatDate(item.due_date)}` : truncate(item.description) || 'No due date',
    icon: ListChecks,
    tone: 'warning',
    route: '/(tabs)/tasks',
  })),
});

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors, accent, spacing, typography, radius, isDark } = useTheme();
  const { masterKey } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchBuckets>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) return;
    setQuery('');
    setResults(EMPTY_RESULTS);
    setIsSearching(false);
    setError('');
  }, [visible]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (!visible || !masterKey || normalizedQuery.length < 2) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      setError('');
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      setError('');

      try {
        const [vaultItems, transactions, notes, tasks] = await Promise.all([
          dbService.getVaultItems(masterKey, {
            search: normalizedQuery,
            sortBy: 'updated_at',
            sortDirection: 'desc',
          }),
          dbService.getTransactions(masterKey, {
            search: normalizedQuery,
            dateRange: 'all',
          }),
          dbService.getNotes(masterKey, {
            search: normalizedQuery,
            sortBy: 'updated_at',
            sortDirection: 'desc',
          }),
          dbService.getTasks(masterKey, { search: normalizedQuery }),
        ]);

        if (!cancelled) {
          setResults(mapSearchResults(vaultItems, transactions, notes, tasks));
        }
      } catch (e) {
        if (!cancelled) {
          setResults(EMPTY_RESULTS);
          setError('Search could not be completed. Try again.');
        }
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [masterKey, query, visible]);

  const totalResults = useMemo(
    () => ENTITY_ORDER.reduce((total, entity) => total + results[entity].length, 0),
    [results]
  );

  const openResult = (result: GlobalSearchResult) => {
    Haptics.selectionAsync().catch(() => {});
    onClose();
    router.push(result.route as any);
  };

  const renderResultRow = (result: GlobalSearchResult) => {
    const ResultIcon = result.icon;
    const tone = {
      accent: {
        backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight,
        color: accent.primary,
      },
      success: { backgroundColor: colors.successBg, color: colors.success },
      info: { backgroundColor: colors.infoBg, color: colors.info },
      warning: { backgroundColor: colors.warningBg, color: colors.warning },
    }[result.tone];

    return (
      <TouchableOpacity
        key={`${result.entity}-${result.id}`}
        onPress={() => openResult(result)}
        style={[
          styles.resultRow,
          {
            backgroundColor: colors.bgSecondary,
            borderColor: colors.borderSubtle,
            borderRadius: radius.lg,
            minHeight: spacing.minTouchTarget + 22,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${result.title}. ${result.subtitle}. Open ${ENTITY_META[result.entity].label}`}
      >
        <View style={[styles.resultIcon, { backgroundColor: tone.backgroundColor, borderRadius: radius.md }]}>
          <ResultIcon size={18} color={tone.color} />
        </View>
        <View style={styles.resultBody}>
          <Text
            numberOfLines={1}
            style={[styles.resultTitle, { color: colors.textPrimary, fontSize: typography.sm }]}
          >
            {result.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.resultSubtitle, { color: colors.textSecondary, fontSize: typography.xs }]}
          >
            {result.subtitle}
          </Text>
          {!!result.detail && (
            <Text
              numberOfLines={1}
              style={[styles.resultDetail, { color: colors.textTertiary, fontSize: typography.xs }]}
            >
              {result.detail}
            </Text>
          )}
        </View>
        <ChevronRight size={17} color={colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderBody = () => {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return (
        <View style={styles.emptyPanel}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: isDark ? accent.primaryBgDark : accent.primaryBgLight,
                borderColor: colors.borderSubtle,
                borderRadius: radius.xl,
              },
            ]}
          >
            <Search size={26} color={accent.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.md }]}>Search your private workspace</Text>
          <Text style={[styles.emptyDescription, { color: colors.textTertiary, fontSize: typography.sm }]}>Find credentials, transactions, notes, and tasks from one local search.</Text>
        </View>
      );
    }

    if (normalizedQuery.length < 2) {
      return (
        <View style={styles.emptyPanel}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.md }]}>Keep typing</Text>
          <Text style={[styles.emptyDescription, { color: colors.textTertiary, fontSize: typography.sm }]}>Enter at least two characters to search encrypted content.</Text>
        </View>
      );
    }

    if (isSearching) {
      return (
        <View style={styles.emptyPanel}>
          <ActivityIndicator color={accent.primary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.md }]}>Searching locally…</Text>
          <Text style={[styles.emptyDescription, { color: colors.textTertiary, fontSize: typography.sm }]}>AWarden is checking your unlocked workspace.</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyPanel}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.md }]}>Search unavailable</Text>
          <Text style={[styles.emptyDescription, { color: colors.textTertiary, fontSize: typography.sm }]}>{error}</Text>
        </View>
      );
    }

    if (!totalResults) {
      return (
        <View style={styles.emptyPanel}>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontSize: typography.md }]}>No matches found</Text>
          <Text style={[styles.emptyDescription, { color: colors.textTertiary, fontSize: typography.sm }]}>Try a title, category, username, tag, or short phrase.</Text>
        </View>
      );
    }

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsSummaryRow}>
          <Text style={[styles.resultsSummary, { color: colors.textTertiary, fontSize: typography.xs }]}>LOCAL RESULTS</Text>
          <Text style={[styles.resultsCount, { color: accent.primary, fontSize: typography.xs }]}>{totalResults} found</Text>
        </View>
        {ENTITY_ORDER.map((entity) => {
          const entityResults = results[entity];
          if (!entityResults.length) return null;
          const EntityIcon = ENTITY_META[entity].icon;
          return (
            <View key={entity} style={styles.resultGroup}>
              <View style={styles.groupHeader}>
                <View style={styles.groupTitleRow}>
                  <EntityIcon size={14} color={colors.textTertiary} />
                  <Text style={[styles.groupTitle, { color: colors.textSecondary, fontSize: typography.xs }]}>{ENTITY_META[entity].label}</Text>
                </View>
                <Text style={[styles.groupCount, { color: colors.textMuted, fontSize: typography.xs }]}>{entityResults.length}</Text>
              </View>
              <View style={styles.resultList}>{entityResults.map(renderResultRow)}</View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Search AWarden"
      subtitle="Private search • stays on this device"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        <Input
          autoFocus={visible}
          placeholder="Search vault, ledger, notes, tasks..."
          value={query}
          onChangeText={setQuery}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          clearable
          containerStyle={styles.searchInput}
          accessibilityLabel="Search private workspace"
        />

        <View
          style={[
            styles.privacyRow,
            { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, borderRadius: radius.full },
          ]}
        >
          <ShieldCheck size={14} color={accent.primary} />
          <Text style={[styles.privacyText, { color: colors.textSecondary, fontSize: typography.xs }]}>Search runs only after unlock and stays local.</Text>
        </View>

        {renderBody()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  searchInput: {
    marginBottom: 2,
  },
  privacyRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  privacyText: {
    fontWeight: '600',
    marginLeft: 5,
  },
  emptyPanel: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  emptyTitle: {
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 320,
    textAlign: 'center',
  },
  resultsContainer: {
    paddingTop: 18,
  },
  resultsSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  resultsSummary: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultsCount: {
    fontWeight: '800',
  },
  resultGroup: {
    marginTop: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
    paddingHorizontal: 2,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  groupCount: {
    fontWeight: '700',
  },
  resultList: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderWidth: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: {
    flex: 1,
    marginHorizontal: 10,
  },
  resultTitle: {
    fontWeight: '800',
  },
  resultSubtitle: {
    fontWeight: '600',
    marginTop: 3,
  },
  resultDetail: {
    marginTop: 3,
  },
});
