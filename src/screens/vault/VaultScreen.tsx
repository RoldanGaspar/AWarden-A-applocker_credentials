/**
 * Life OS & Vault - Full Encrypted Password Vault Screen
 * Password Manager with search, folder filtering, tag chips, password generator, health auditor, and full CRUD
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  KeyRound,
  Plus,
  Search,
  Star,
  Folder as FolderIcon,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Tag as TagIcon,
  X,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card, Input, Tag, FAB, Modal, Button, EmptyState, AnimatedPatternBackground, ScreenEntrance } from '../../components/ui';
import {
  CredentialCard,
  CredentialForm,
  CredentialDetailModal,
  PasswordGeneratorModal,
  FolderManagerModal,
  PasswordHealthModal,
  TagFilterModal,
} from '../../components/vault';
import { dbService } from '../../services/db';
import { VaultItem, Folder, PasswordHealthReport } from '../../types/models';

export const VaultScreen: React.FC = () => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();
  const isFocused = useIsFocused();

  const [items, setItems] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [healthReport, setHealthReport] = useState<PasswordHealthReport | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<VaultItem | null>(null);
  const [editingItem, setEditingItem] = useState<VaultItem | null>(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [isHealthModalVisible, setIsHealthModalVisible] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const loadVaultData = useCallback(async () => {
    if (!masterKey) return;

    try {
      const [vaultList, folderList, health] = await Promise.all([
        dbService.getVaultItems(masterKey, {
          search: searchQuery,
          folderId: selectedFolderId,
          tag: selectedTag,
          onlyFavorites,
        }),
        dbService.getFolders('vault'),
        dbService.getPasswordHealth(masterKey),
      ]);

      setItems(vaultList);
      setFolders(folderList);
      setHealthReport(health);
    } catch (e) {
      console.warn('Failed to load vault items:', e);
    }
  }, [masterKey, searchQuery, selectedFolderId, selectedTag, onlyFavorites]);

  useFocusEffect(
    useCallback(() => {
      loadVaultData();
    }, [loadVaultData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVaultData();
    setRefreshing(false);
  };

  // Distinct tags collected from all items
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => (i.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [items]);

  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  const handleCreateCredential = async (newItem: Omit<VaultItem, 'created_at' | 'updated_at'>) => {
    if (!masterKey) return;
    await dbService.createVaultItem(newItem, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setIsAddModalVisible(false);
    await loadVaultData();
  };

  const handleUpdateCredential = async (updatedItem: Omit<VaultItem, 'created_at' | 'updated_at'>) => {
    if (!masterKey) return;
    const fullItem: VaultItem = {
      ...updatedItem,
      created_at: editingItem?.created_at || Date.now(),
      updated_at: Date.now(),
    };
    await dbService.updateVaultItem(fullItem, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setEditingItem(null);
    if (selectedItemForDetail?.id === fullItem.id) {
      setSelectedItemForDetail(fullItem);
    }
    await loadVaultData();
  };

  const handleFixCredential = (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (target) {
      setEditingItem(target);
    }
  };

  const hasActiveFilters = !!searchQuery || selectedFolderId !== null || onlyFavorites || selectedTag !== null;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedFolderId(null);
    setOnlyFavorites(false);
    setSelectedTag(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <ScreenEntrance style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <AnimatedPatternBackground intensity={0.35} active={isFocused} />
      {/* Top Header & Actions */}
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Input
          placeholder="Search credentials, usernames, notes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color={colors.textMuted} />}
          clearable
          containerStyle={{ marginBottom: 8 }}
        />

        {/* Action icons bar */}
        <View style={styles.actionIconsRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsHealthModalVisible(true);
            }}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor:
                  healthReport && (healthReport.weakCount > 0 || healthReport.duplicateCount > 0)
                    ? colors.warningBg
                    : colors.bgSecondary,
                borderRadius: radius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Password Health Security Auditor"
          >
            {healthReport && (healthReport.weakCount > 0 || healthReport.duplicateCount > 0) ? (
              <ShieldAlert size={18} color={colors.warning} />
            ) : (
              <ShieldCheck size={18} color={colors.success} />
            )}
            <Text
              style={[
                styles.headerActionText,
                {
                  color:
                    healthReport && (healthReport.weakCount > 0 || healthReport.duplicateCount > 0)
                      ? colors.warning
                      : colors.textSecondary,
                  fontSize: typography.xs,
                },
              ]}
            >
              Health ({healthReport?.healthScore || 100}%)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsFolderModalVisible(true);
            }}
            style={[styles.headerActionBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
            accessibilityRole="button"
            accessibilityLabel="Manage Folders"
          >
            <FolderIcon size={16} color={accent.primary} />
            <Text style={[styles.headerActionText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              Folders ({folders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsTagModalVisible(true);
            }}
            style={[
              styles.headerActionBtn,
              {
                backgroundColor: selectedTag ? accent.primaryBgLight : colors.bgSecondary,
                borderRadius: radius.md,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter by Tag"
          >
            <TagIcon size={16} color={selectedTag ? accent.primary : colors.textSecondary} />
            <Text
              style={[
                styles.headerActionText,
                { color: selectedTag ? accent.primary : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              {selectedTag || 'Tags'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollView}
          contentContainerStyle={styles.filterScrollContent}
        >
          {/* All chip */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setSelectedFolderId(null);
              setOnlyFavorites(false);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFolderId === null && !onlyFavorites ? accent.primary : colors.bgSecondary,
                borderColor:
                  selectedFolderId === null && !onlyFavorites ? accent.primary : colors.borderSubtle,
                borderRadius: radius.full,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Show all credentials"
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedFolderId === null && !onlyFavorites ? '#FFFFFF' : colors.textSecondary,
                  fontSize: typography.xs,
                },
              ]}
            >
              All Items ({items.length})
            </Text>
          </TouchableOpacity>

          {/* Favorites Chip */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setOnlyFavorites(!onlyFavorites);
              setSelectedFolderId(null);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: onlyFavorites ? accent.primary : colors.bgSecondary,
                borderColor: onlyFavorites ? accent.primary : colors.borderSubtle,
                borderRadius: radius.full,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Show favorites only"
          >
            <Star
              size={14}
              color={onlyFavorites ? '#FFFFFF' : colors.textSecondary}
              fill={onlyFavorites ? '#FFFFFF' : 'transparent'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterChipText,
                { color: onlyFavorites ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              Starred
            </Text>
          </TouchableOpacity>

          {/* Folder Chips */}
          {folders.map((f) => {
            const isSelected = selectedFolderId === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSelectedFolderId(isSelected ? null : f.id);
                  setOnlyFavorites(false);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? f.color : colors.bgSecondary,
                    borderColor: isSelected ? f.color : colors.borderSubtle,
                    borderRadius: radius.full,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Filter by folder ${f.name}`}
              >
                <View
                  style={[
                    styles.folderDot,
                    { backgroundColor: isSelected ? '#FFFFFF' : f.color },
                  ]}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: typography.xs },
                  ]}
                >
                  {f.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Filter Clear Bar */}
        {hasActiveFilters && (
          <View style={styles.activeFilterBanner}>
            <Text style={[styles.activeFilterText, { color: colors.textTertiary, fontSize: typography.xs }]}>
              Filtered results active
            </Text>
            <TouchableOpacity
              onPress={clearAllFilters}
              style={styles.clearFiltersBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear all filters"
            >
              <X size={14} color={accent.primary} />
              <Text style={[styles.clearFiltersText, { color: accent.primary, fontSize: typography.xs }]}>
                Clear filters
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Credential List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.lg, paddingBottom: 110 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accent.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            owlMood="curious"
            title={hasActiveFilters ? 'No Matching Credentials' : 'The Vault Nest is Empty'}
            description={
              hasActiveFilters
                ? 'AWarden searched all encrypted branches. Try adjusting your search query.'
                : 'No secrets guarded yet. Add your first credential to keep it safe under AWarden’s watch.'
            }
            actionTitle={hasActiveFilters ? 'Clear Filters' : 'Guard First Credential'}
            onActionPress={hasActiveFilters ? clearAllFilters : () => setIsAddModalVisible(true)}
            style={{ marginTop: 40 }}
          />
        }
        renderItem={({ item }) => (
          <CredentialCard
            item={item}
            folder={item.folder_id ? folderMap.get(item.folder_id) : null}
            onPress={() => setSelectedItemForDetail(item)}
            onEdit={() => setEditingItem(item)}
            onDelete={async () => {
              await dbService.deleteVaultItem(item.id);
              await loadVaultData();
            }}
            onToggleFavorite={async () => {
              await dbService.toggleVaultFavorite(item.id, !item.is_favorite);
              await loadVaultData();
            }}
          />
        )}
      />

      {/* Floating Action Button (FAB) */}
      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setIsAddModalVisible(true);
        }}
        accessibilityLabel="Add new password credential"
      />

      {/* 1. Credential Detail Modal */}
      <CredentialDetailModal
        visible={!!selectedItemForDetail}
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        onEdit={(itemToEdit) => {
          setSelectedItemForDetail(null);
          setEditingItem(itemToEdit);
        }}
        onDeleted={() => {
          setSelectedItemForDetail(null);
          loadVaultData();
        }}
        onFavoriteToggled={() => {
          loadVaultData();
        }}
      />

      {/* 2. Add Credential Modal */}
      <Modal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        title="New Credential"
        subtitle="Stored securely in local AES-256 database"
        variant="bottomSheet"
      >
        <CredentialForm
          onSave={handleCreateCredential}
          onCancel={() => setIsAddModalVisible(false)}
          submitButtonTitle="Store Credential"
        />
      </Modal>

      {/* 3. Edit Credential Modal */}
      <Modal
        visible={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={`Edit ${editingItem?.title || 'Credential'}`}
        subtitle="Update stored credentials & notes"
        variant="bottomSheet"
      >
        {editingItem && (
          <CredentialForm
            initialItem={editingItem}
            onSave={handleUpdateCredential}
            onCancel={() => setEditingItem(null)}
            submitButtonTitle="Save Changes"
          />
        )}
      </Modal>

      {/* 4. Folder Management Modal */}
      <FolderManagerModal
        visible={isFolderModalVisible}
        onClose={() => setIsFolderModalVisible(false)}
        onFoldersChanged={() => loadVaultData()}
      />

      {/* 5. Password Health Auditor Modal */}
      <PasswordHealthModal
        visible={isHealthModalVisible}
        onClose={() => setIsHealthModalVisible(false)}
        onFixCredential={handleFixCredential}
      />

      {/* 6. Tag Filter Modal */}
      <TagFilterModal
        visible={isTagModalVisible}
        onClose={() => setIsTagModalVisible(false)}
        availableTags={availableTags}
        selectedTag={selectedTag}
        onSelectTag={(tag) => {
          setSelectedTag(tag);
        }}
      />
    </ScreenEntrance>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingBottom: 4,
  },
  actionIconsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  headerActionText: {
    fontWeight: '600',
  },
  filterScrollView: {
    marginBottom: 8,
  },
  filterScrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: '600',
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  activeFilterText: {
    fontWeight: '500',
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearFiltersText: {
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 4,
  },
});

export default VaultScreen;
