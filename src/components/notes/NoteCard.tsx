/**
 * Life OS & Vault - Safe Note Card Component
 * List item card displaying pin badge, favorite star, stripped Markdown plain-text snippet, and relative time
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Pin,
  Star,
  Clock,
  Copy,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Card, Tag, AnimatedPressable } from '../ui';
import { Note, Folder } from '../../types/models';

export interface NoteCardProps {
  note: Note;
  folder?: Folder | null;
  onPress: () => void;
  onEdit: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export const stripMarkdown = (md: string): string => {
  if (!md) return '';
  return md
    .replace(/^#+\s+/gm, '') // Remove headers
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // Remove italic
    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
    .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Remove code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links
    .replace(/^>\s+/gm, '') // Remove quotes
    .replace(/^[-*+]\s+/gm, '') // Remove list bullets
    .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
    .replace(/\n+/g, ' ') // Collapse newlines
    .trim();
};

export const getRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  folder,
  onPress,
  onEdit,
  onTogglePin,
  onToggleFavorite,
  onDuplicate,
  onDelete,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      note.title || 'Note Options',
      getRelativeTime(note.updated_at),
      [
        { text: 'Cancel', style: 'cancel' },
        { text: note.is_pinned ? 'Unpin Note' : 'Pin to Top', onPress: onTogglePin },
        { text: note.is_favorite ? 'Unstar Note' : 'Add to Starred', onPress: onToggleFavorite },
        { text: 'Duplicate Note', onPress: onDuplicate },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const plainSnippet = stripMarkdown(note.content);
  const folderColor = folder?.color || colors.borderSubtle;

  return (
    <Card
      variant="outlined"
      style={[styles.card, { borderLeftColor: folder ? folder.color : colors.borderSubtle, borderLeftWidth: folder ? 4 : 1 }]}
      accessibilityLabel={`Note: ${note.title}, ${plainSnippet ? plainSnippet.slice(0, 50) : 'Empty note'}`}
    >
      <AnimatedPressable
        onLongPress={handleLongPress}
        style={styles.innerTouchable}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Note: ${note.title}, ${plainSnippet ? plainSnippet.slice(0, 50) : 'Empty note'}`}
      >
        {/* Header Row: Pin & Favorite */}
        <View style={styles.topRow}>
          <View style={styles.leftPills}>
            {note.is_pinned && (
              <View style={[styles.pinBadge, { backgroundColor: accent.primaryBgLight, borderRadius: radius.xs }]}>
                <Pin size={12} color={accent.primary} />
                <Text style={[styles.pinText, { color: accent.primary, fontSize: 10 }]}>Pinned</Text>
              </View>
            )}
            {folder && (
              <View style={[styles.folderBadge, { backgroundColor: colors.bgSecondary, borderRadius: radius.xs }]}>
                <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
                <Text style={[styles.folderText, { color: colors.textTertiary, fontSize: 10 }]}>
                  {folder.name}
                </Text>
              </View>
            )}
          </View>

          <AnimatedPressable
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            style={styles.starBtn}
            accessibilityRole="button"
            accessibilityLabel={note.is_favorite ? 'Unstar note' : 'Star note'}
          >
            <Star
              size={16}
              color={note.is_favorite ? accent.primary : colors.textMuted}
              fill={note.is_favorite ? accent.primary : 'transparent'}
            />
          </AnimatedPressable>
        </View>

        {/* Title */}
        <Text
          style={[styles.title, { color: colors.textPrimary, fontSize: typography.base }]}
          numberOfLines={1}
        >
          {note.title}
        </Text>

        {/* Content snippet */}
        {plainSnippet ? (
          <Text
            style={[styles.snippet, { color: colors.textSecondary, fontSize: typography.sm }]}
            numberOfLines={2}
          >
            {plainSnippet}
          </Text>
        ) : null}

        {/* Footer: Tags & Relative Time */}
        <View style={styles.footerRow}>
          <View style={styles.tagsCol}>
            {note.tags && note.tags.length > 0 ? (
              <View style={styles.tagsList}>
                {note.tags.slice(0, 2).map((t) => (
                  <Tag key={t} label={t} size="sm" />
                ))}
                {note.tags.length > 2 && (
                  <Text style={[styles.moreTags, { color: colors.textMuted, fontSize: 10 }]}>
                    +{note.tags.length - 2}
                  </Text>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.timeBox}>
            <Clock size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
            <Text style={[styles.timeText, { color: colors.textMuted, fontSize: 10 }]}>
              {getRelativeTime(note.updated_at)}
            </Text>
          </View>
        </View>
      </AnimatedPressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 8,
    overflow: 'hidden',
  },
  innerTouchable: {
    padding: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  leftPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  pinText: {
    fontWeight: '700',
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 4,
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  folderText: {
    fontWeight: '600',
  },
  starBtn: {
    padding: 4,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
  },
  snippet: {
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  tagsCol: {
    flex: 1,
  },
  tagsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreTags: {
    fontWeight: '600',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontWeight: '500',
  },
});
