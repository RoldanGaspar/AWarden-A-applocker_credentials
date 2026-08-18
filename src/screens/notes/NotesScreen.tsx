/**
 * Life OS & Vault - Safe Markdown Notes Screen
 * Full-text search across encrypted notes, folder chips, tag filter, markdown editor, and full CRUD
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
  Modal as RNModal,
} from 'react-native';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Star,
  Folder as FolderIcon,
  Tag as TagIcon,
  X,
  SlidersHorizontal,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Input, Tag, FAB, EmptyState, Card } from '../../components/ui';
import {
  NoteCard,
  NoteEditor,
  NoteFolderManagerModal,
  NoteTagFilterModal,
} from '../../components/notes';
import { dbService } from '../../services/db';
import { Note, Folder } from '../../types/models';

export const NotesScreen: React.FC = () => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [isTagModalVisible, setIsTagModalVisible] = useState(false);

  const loadNotesData = useCallback(async () => {
    if (!masterKey) return;

    try {
      const [noteList, folderList] = await Promise.all([
        dbService.getNotes(masterKey, {
          search: searchQuery,
          folderId: selectedFolderId,
          tag: selectedTag,
          onlyPinned,
          onlyFavorites,
        }),
        dbService.getFolders('notes'),
      ]);

      setNotes(noteList);
      setFolders(folderList);
    } catch (e) {
      console.warn('Failed to load notes:', e);
    }
  }, [masterKey, searchQuery, selectedFolderId, selectedTag, onlyPinned, onlyFavorites]);

  useFocusEffect(
    useCallback(() => {
      loadNotesData();
    }, [loadNotesData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotesData();
    setRefreshing(false);
  };

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  const folderMap = useMemo(() => {
    const map = new Map<string, Folder>();
    folders.forEach((f) => map.set(f.id, f));
    return map;
  }, [folders]);

  const handleSaveNote = async (item: Omit<Note, 'created_at' | 'updated_at'>) => {
    if (!masterKey) return;

    if (editingNote) {
      const fullNote: Note = {
        ...item,
        created_at: editingNote.created_at,
        updated_at: Date.now(),
      };
      await dbService.updateNote(fullNote, masterKey);
    } else {
      await dbService.createNote(item, masterKey);
    }

    setIsEditorOpen(false);
    setEditingNote(null);
    await loadNotesData();
  };

  const handleDuplicate = async (note: Note) => {
    if (!masterKey) return;
    await dbService.duplicateNote(note.id, masterKey);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await loadNotesData();
  };

  const handleDelete = async (noteId: string) => {
    await dbService.deleteNote(noteId);
    setIsEditorOpen(false);
    setEditingNote(null);
    await loadNotesData();
  };

  const hasActiveFilters =
    !!searchQuery || selectedFolderId !== null || onlyPinned || onlyFavorites || selectedTag !== null;

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedFolderId(null);
    setOnlyPinned(false);
    setOnlyFavorites(false);
    setSelectedTag(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Top Header Controls */}
      <View style={[styles.topBar, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Input
          placeholder="Search notes, content, tags..."
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
              setIsFolderModalVisible(true);
            }}
            style={[styles.headerActionBtn, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}
            accessibilityRole="button"
            accessibilityLabel="Manage Note Folders"
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
              setOnlyPinned(false);
              setOnlyFavorites(false);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor:
                  selectedFolderId === null && !onlyPinned && !onlyFavorites ? accent.primary : colors.bgSecondary,
                borderColor:
                  selectedFolderId === null && !onlyPinned && !onlyFavorites ? accent.primary : colors.borderSubtle,
                borderRadius: radius.full,
              },
            ]}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.filterChipText,
                {
                  color: selectedFolderId === null && !onlyPinned && !onlyFavorites ? '#FFFFFF' : colors.textSecondary,
                  fontSize: typography.xs,
                },
              ]}
            >
              All Notes ({notes.length})
            </Text>
          </TouchableOpacity>

          {/* Pinned Chip */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setOnlyPinned(!onlyPinned);
              setSelectedFolderId(null);
            }}
            style={[
              styles.filterChip,
              {
                backgroundColor: onlyPinned ? accent.primary : colors.bgSecondary,
                borderColor: onlyPinned ? accent.primary : colors.borderSubtle,
                borderRadius: radius.full,
              },
            ]}
            accessibilityRole="button"
          >
            <Pin size={13} color={onlyPinned ? '#FFFFFF' : colors.textSecondary} style={{ marginRight: 4 }} />
            <Text
              style={[
                styles.filterChipText,
                { color: onlyPinned ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              Pinned
            </Text>
          </TouchableOpacity>

          {/* Starred Chip */}
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
          >
            <Star
              size={13}
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
                  setOnlyPinned(false);
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
              Filtered ({notes.length} found)
            </Text>
            <TouchableOpacity
              onPress={clearAllFilters}
              style={styles.clearFiltersBtn}
              accessibilityRole="button"
            >
              <X size={14} color={accent.primary} />
              <Text style={[styles.clearFiltersText, { color: accent.primary, fontSize: typography.xs }]}>
                Clear filters
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Notes List */}
      <FlatList
        data={notes}
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
            icon={<FileText size={48} color={accent.primary} />}
            title={hasActiveFilters ? 'No Matching Notes' : 'No Safe Notes Yet'}
            description={
              hasActiveFilters
                ? 'Try clearing active filters or adjusting your search query.'
                : 'Write daily journals, code snippets, and confidential documentation with AES-256 encryption.'
            }
            actionTitle={hasActiveFilters ? 'Clear Filters' : 'Create First Note'}
            onActionPress={hasActiveFilters ? clearAllFilters : () => {
              setEditingNote(null);
              setIsEditorOpen(true);
            }}
            style={{ marginTop: 40 }}
          />
        }
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            folder={item.folder_id ? folderMap.get(item.folder_id) : null}
            onPress={() => {
              setEditingNote(item);
              setIsEditorOpen(true);
            }}
            onEdit={() => {
              setEditingNote(item);
              setIsEditorOpen(true);
            }}
            onTogglePin={async () => {
              await dbService.toggleNotePin(item.id, !item.is_pinned);
              await loadNotesData();
            }}
            onToggleFavorite={async () => {
              await dbService.toggleNoteFavorite(item.id, !item.is_favorite);
              await loadNotesData();
            }}
            onDuplicate={() => handleDuplicate(item)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
      />

      {/* Floating Action Button (FAB) */}
      <FAB
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setEditingNote(null);
          setIsEditorOpen(true);
        }}
        accessibilityLabel="Create new markdown note"
      />

      {/* Full-Screen Note Editor Modal */}
      <RNModal
        visible={isEditorOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
      >
        <NoteEditor
          initialNote={editingNote}
          onSave={handleSaveNote}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingNote(null);
          }}
          onDelete={editingNote ? () => handleDelete(editingNote.id) : undefined}
        />
      </RNModal>

      {/* Folder Manager Modal */}
      <NoteFolderManagerModal
        visible={isFolderModalVisible}
        onClose={() => setIsFolderModalVisible(false)}
        onFoldersChanged={() => loadNotesData()}
      />

      {/* Tag Filter Modal */}
      <NoteTagFilterModal
        visible={isTagModalVisible}
        onClose={() => setIsTagModalVisible(false)}
        availableTags={availableTags}
        selectedTag={selectedTag}
        onSelectTag={(tag) => {
          setSelectedTag(tag);
        }}
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

export default NotesScreen;
