/**
 * Life OS & Vault - Credential Card Component
 * List item card displaying title, masked username, folder accent, tags, favorite star, and quick copy action
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Star,
  Copy,
  Check,
  MoreVertical,
  ExternalLink,
  Edit2,
  Trash2,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Card, Tag } from '../ui';
import { VaultItem, Folder } from '../../types/models';

export interface CredentialCardProps {
  item: VaultItem;
  folder?: Folder | null;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  item,
  folder,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = async () => {
    if (!item.password) return;
    await Clipboard.setStringAsync(item.password);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      item.title,
      item.username || 'Account Options',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Copy Password', onPress: handleCopyPassword },
        { text: 'Edit Credential', onPress: onEdit },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const folderColor = folder?.color || accent.primary;

  return (
    <Card
      variant="outlined"
      style={[styles.card, { borderLeftColor: folderColor, borderLeftWidth: 4 }]}
      onPress={onPress}
      accessibilityLabel={`Credential for ${item.title}, username ${item.username || 'none'}`}
    >
      <TouchableOpacity
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        style={styles.innerTouchable}
        onPress={onPress}
      >
        <View style={styles.contentRow}>
          {/* Main Info */}
          <View style={styles.mainInfo}>
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.textPrimary, fontSize: typography.base }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              {folder && (
                <View style={[styles.folderPill, { backgroundColor: colors.bgSecondary, borderRadius: radius.xs }]}>
                  <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
                  <Text style={[styles.folderName, { color: colors.textTertiary, fontSize: 10 }]}>
                    {folder.name}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.username, { color: colors.textSecondary, fontSize: typography.sm }]}
              numberOfLines={1}
            >
              {item.username || 'No username'}
            </Text>

            {/* Tags (max 2) */}
            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 2).map((t) => (
                  <Tag key={t} label={t} size="sm" />
                ))}
                {item.tags.length > 2 && (
                  <Text style={[styles.moreTags, { color: colors.textMuted, fontSize: 10 }]}>
                    +{item.tags.length - 2}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Right Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              style={[styles.starBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
              accessibilityRole="button"
              accessibilityLabel={item.is_favorite ? 'Unstar credential' : 'Star credential'}
            >
              <Star
                size={18}
                color={item.is_favorite ? accent.primary : colors.textMuted}
                fill={item.is_favorite ? accent.primary : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleCopyPassword();
              }}
              style={[
                styles.copyBtn,
                {
                  backgroundColor: copied ? colors.successBg : colors.bgSecondary,
                  borderRadius: radius.md,
                  minWidth: spacing.minTouchTarget,
                  minHeight: spacing.minTouchTarget,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Copy password for ${item.title}`}
            >
              {copied ? (
                <Check size={16} color={colors.success} />
              ) : (
                <Copy size={16} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainInfo: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontWeight: '700',
    flexShrink: 1,
  },
  folderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  folderName: {
    fontWeight: '600',
  },
  username: {
    marginTop: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  moreTags: {
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  copyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginLeft: 4,
  },
});
