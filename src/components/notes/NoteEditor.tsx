/**
 * Life OS & Vault - Full Markdown Note Editor Component
 * Full-screen editor supporting Write/Preview modes, formatting toolbar, folder picker, tags, and pin/star actions
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Check,
  Star,
  Pin,
  Eye,
  Edit3,
  Plus,
  Trash2,
  Folder as FolderIcon,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Tag, Card } from '../ui';
import { MarkdownToolbar } from './MarkdownToolbar';
import { MarkdownView } from './MarkdownView';
import { dbService } from '../../services/db';
import { Note, Folder } from '../../types/models';

export interface NoteEditorProps {
  initialNote?: Note | null;
  onSave: (note: Omit<Note, 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialNote,
  onSave,
  onCancel,
  onDelete,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [title, setTitle] = useState(initialNote?.title || '');
  const [content, setContent] = useState(initialNote?.content || '');
  const [folderId, setFolderId] = useState<string | null>(initialNote?.folder_id || null);
  const [isPinned, setIsPinned] = useState(initialNote?.is_pinned || false);
  const [isFavorite, setIsFavorite] = useState(initialNote?.is_favorite || false);
  const [tags, setTags] = useState<string[]>(initialNote?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Cursor selection tracking
  const [selection, setSelection] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const data = await dbService.getFolders('notes');
      setFolders(data);
    } catch (e) {
      console.warn('Failed to load note folders:', e);
    }
  };

  const handleApplyFormat = (prefix: string, suffix: string, multiline?: boolean) => {
    const start = selection.start;
    const end = selection.end;

    const selectedText = content.substring(start, end);
    let replacement = '';

    if (multiline) {
      replacement = `${prefix}${selectedText || 'code'}${suffix}`;
    } else {
      replacement = `${prefix}${selectedText || 'text'}${suffix}`;
    }

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Reposition cursor
    const newCursorPos = start + prefix.length + (selectedText ? selectedText.length : 4);
    setTimeout(() => {
      setSelection({ start: newCursorPos, end: newCursorPos });
    }, 50);
  };

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (tags.length >= 5) {
      setError('Maximum 5 tags allowed per note');
      return;
    }
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setNewTag('');
    setShowTagInput(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a note title');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSave({
        id: initialNote?.id || `note_${Date.now()}`,
        folder_id: folderId,
        title: title.trim(),
        content: content,
        is_pinned: isPinned,
        is_favorite: isFavorite,
        tags,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!initialNote || !onDelete) return;
    Alert.alert(
      'Delete Note?',
      `Are you sure you want to delete "${initialNote.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onDelete();
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.topHeader, { borderBottomColor: colors.borderSubtle }]}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to notes"
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Mode Toggle (Write / Preview) */}
        <View style={[styles.modeToggle, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setMode('write');
            }}
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'write' ? accent.primary : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'write' }}
          >
            <Edit3 size={14} color={mode === 'write' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'write' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              Write
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setMode('preview');
            }}
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'preview' ? accent.primary : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'preview' }}
          >
            <Eye size={14} color={mode === 'preview' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'preview' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              Preview
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action icons (Pin, Star, Save) */}
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsPinned(!isPinned);
            }}
            style={[
              styles.iconBtn,
              { backgroundColor: isPinned ? accent.primaryBgLight : colors.bgSecondary, borderRadius: radius.sm },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPinned ? 'Unpin note' : 'Pin note to top'}
          >
            <Pin size={16} color={isPinned ? accent.primary : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsFavorite(!isFavorite);
            }}
            style={[
              styles.iconBtn,
              { backgroundColor: isFavorite ? accent.primaryBgLight : colors.bgSecondary, borderRadius: radius.sm },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={16}
              color={isFavorite ? accent.primary : colors.textSecondary}
              fill={isFavorite ? accent.primary : 'transparent'}
            />
          </TouchableOpacity>

          <Button
            title="Save"
            size="sm"
            variant="primary"
            loading={isSaving}
            onPress={handleSave}
            iconLeft={<Check size={14} color="#FFFFFF" />}
            style={{ paddingHorizontal: 14 }}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.bodyScroll, { padding: spacing.lg }]}>
        {/* Title Input */}
        <TextInput
          placeholder="Note Title..."
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.titleInput,
            { color: colors.textPrimary, fontSize: typography.xl },
          ]}
          autoFocus={!initialNote}
        />

        {error ? <Text style={{ color: colors.danger, fontSize: typography.xs, marginBottom: 8 }}>{error}</Text> : null}

        {/* Folder Category Picker */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.folderRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setFolderId(null);
            }}
            style={[
              styles.folderPill,
              {
                backgroundColor: folderId === null ? accent.primary : colors.bgSecondary,
                borderColor: folderId === null ? accent.primary : colors.borderSubtle,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={[
                styles.folderPillText,
                { color: folderId === null ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              No Folder
            </Text>
          </TouchableOpacity>

          {folders.map((f) => {
            const isSelected = folderId === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setFolderId(isSelected ? null : f.id);
                }}
                style={[
                  styles.folderPill,
                  {
                    backgroundColor: isSelected ? f.color : colors.bgSecondary,
                    borderColor: isSelected ? f.color : colors.borderSubtle,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <View style={[styles.folderDot, { backgroundColor: isSelected ? '#FFFFFF' : f.color }]} />
                <Text
                  style={[
                    styles.folderPillText,
                    { color: isSelected ? '#FFFFFF' : colors.textPrimary, fontSize: typography.xs },
                  ]}
                >
                  {f.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tags Row */}
        <View style={styles.tagsContainer}>
          {tags.map((t) => (
            <Tag key={t} label={t} size="sm" onRemove={() => handleRemoveTag(t)} />
          ))}

          {!showTagInput && tags.length < 5 && (
            <TouchableOpacity
              onPress={() => setShowTagInput(true)}
              style={[styles.addTagBtn, { borderColor: accent.primary, borderRadius: radius.full }]}
            >
              <Plus size={12} color={accent.primary} />
              <Text style={[styles.addTagText, { color: accent.primary, fontSize: typography.xs }]}>
                Tag
              </Text>
            </TouchableOpacity>
          )}

          {showTagInput && (
            <View style={styles.tagInputWrapper}>
              <TextInput
                placeholder="Tag name"
                placeholderTextColor={colors.textMuted}
                value={newTag}
                onChangeText={setNewTag}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                autoFocus
                style={[styles.smallTagInput, { color: colors.textPrimary, borderColor: accent.primary }]}
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.tagConfirmBtn}>
                <Check size={14} color={accent.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main Content Area */}
        {mode === 'write' ? (
          <TextInput
            ref={inputRef}
            placeholder="Type your notes in Markdown (headers, lists, code, bold, quotes)..."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            multiline
            style={[
              styles.contentInput,
              { color: colors.textPrimary, fontSize: typography.base },
            ]}
          />
        ) : (
          <View style={styles.previewContainer}>
            <MarkdownView content={content} />
          </View>
        )}

        {/* Footer info & Delete */}
        {initialNote && (
          <View style={[styles.footerArea, { borderTopColor: colors.borderSubtle }]}>
            <View style={styles.timestampBox}>
              <Clock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
              <Text style={[styles.timestampText, { color: colors.textMuted, fontSize: typography.xs }]}>
                Last updated {new Date(initialNote.updated_at).toLocaleString()}
              </Text>
            </View>

            {onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.deleteBtn, { backgroundColor: colors.dangerBg, borderRadius: radius.md }]}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
              >
                <Trash2 size={16} color={colors.danger} />
                <Text style={[styles.deleteBtnText, { color: colors.danger, fontSize: typography.xs }]}>
                  Delete Note
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Formatting Toolbar (Only in Write Mode) */}
      {mode === 'write' && <MarkdownToolbar onApplyFormat={handleApplyFormat} />}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 3,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  modeBtnText: {
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyScroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  titleInput: {
    fontWeight: '800',
    paddingVertical: 8,
    marginBottom: 8,
  },
  folderRow: {
    marginBottom: 12,
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  folderPillText: {
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 2,
  },
  addTagText: {
    fontWeight: '600',
  },
  tagInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallTagInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    width: 90,
  },
  tagConfirmBtn: {
    padding: 4,
    marginLeft: 4,
  },
  contentInput: {
    flex: 1,
    minHeight: 280,
    textAlignVertical: 'top',
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  previewContainer: {
    flex: 1,
    minHeight: 280,
  },
  footerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  timestampBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampText: {},
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  deleteBtnText: {
    fontWeight: '700',
  },
});
