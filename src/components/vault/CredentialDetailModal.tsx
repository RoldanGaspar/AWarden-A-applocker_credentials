/**
 * Life OS & Vault - Credential Detail Modal
 * Detailed inspection of encrypted credentials, show/hide password, copy actions, and website launch
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  Folder as FolderIcon,
  Clock,
  Shield,
  FileText,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button, Card, Tag } from '../ui';
import { dbService } from '../../services/db';
import { VaultItem, Folder } from '../../types/models';

export interface CredentialDetailModalProps {
  visible: boolean;
  item: VaultItem | null;
  onClose: () => void;
  onEdit: (item: VaultItem) => void;
  onDeleted: () => void;
  onFavoriteToggled: () => void;
}

export const CredentialDetailModal: React.FC<CredentialDetailModalProps> = ({
  visible,
  item,
  onClose,
  onEdit,
  onDeleted,
  onFavoriteToggled,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [clipboardTimer, setClipboardTimer] = useState<number | null>(null);

  useEffect(() => {
    if (item && item.folder_id) {
      loadFolder(item.folder_id);
    } else {
      setFolder(null);
    }
    setShowPassword(false);
    setCopiedField(null);
  }, [item]);

  const loadFolder = async (fId: string) => {
    try {
      const folders = await dbService.getFolders('vault');
      const found = folders.find((f) => f.id === fId);
      setFolder(found || null);
    } catch (e) {
      console.warn('Failed to load folder for item:', e);
    }
  };

  const handleCopy = async (field: 'username' | 'password', val: string) => {
    if (!val) return;
    await Clipboard.setStringAsync(val);
    setCopiedField(field);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (field === 'password') {
      setClipboardTimer(30);
      const interval = setInterval(() => {
        setClipboardTimer((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setTimeout(() => {
      setCopiedField(null);
    }, 3000);
  };

  const handleOpenUrl = async () => {
    if (!item?.url) return;
    let target = item.url;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = `https://${target}`;
    }
    try {
      await Linking.openURL(target);
    } catch (e) {
      Alert.alert('Invalid URL', 'Could not open this website.');
    }
  };

  const handleToggleFavorite = async () => {
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await dbService.toggleVaultFavorite(item.id, !item.is_favorite);
    item.is_favorite = !item.is_favorite;
    onFavoriteToggled();
  };

  const handleDelete = () => {
    if (!item) return;
    Alert.alert(
      'Delete Credential?',
      `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dbService.deleteVaultItem(item.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onDeleted();
            onClose();
          },
        },
      ]
    );
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={item.title}
      subtitle={folder ? folder.name : 'Unassigned'}
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {/* Header Actions */}
        <View style={styles.headerBar}>
          {folder && (
            <View
              style={[
                styles.folderBadge,
                { backgroundColor: colors.bgSecondary, borderColor: folder.color, borderRadius: radius.full },
              ]}
            >
              <View style={[styles.folderDot, { backgroundColor: folder.color }]} />
              <Text style={[styles.folderText, { color: colors.textPrimary, fontSize: typography.xs }]}>
                {folder.name}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleToggleFavorite}
            style={[
              styles.favoriteBtn,
              { backgroundColor: item.is_favorite ? accent.primaryBgLight : colors.bgSecondary, borderRadius: radius.md },
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              size={18}
              color={item.is_favorite ? accent.primary : colors.textMuted}
              fill={item.is_favorite ? accent.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Username Row */}
        <Card variant="outlined" style={[styles.fieldCard, { marginBottom: spacing.sm }]}>
          <Text style={[styles.fieldLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
            USERNAME / EMAIL
          </Text>
          <View style={styles.fieldValueRow}>
            <Text
              style={[styles.fieldValue, { color: colors.textPrimary, fontSize: typography.base }]}
              selectable
            >
              {item.username || 'No username'}
            </Text>
            {item.username ? (
              <TouchableOpacity
                onPress={() => handleCopy('username', item.username)}
                style={[styles.copyIconBtn, { backgroundColor: copiedField === 'username' ? colors.successBg : colors.bgSecondary }]}
                accessibilityRole="button"
                accessibilityLabel="Copy username"
              >
                {copiedField === 'username' ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <Copy size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </Card>

        {/* Password Row */}
        <Card variant="outlined" style={[styles.fieldCard, { marginBottom: spacing.sm }]}>
          <View style={styles.pwdHeaderRow}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              PASSWORD
            </Text>
            {clipboardTimer !== null && (
              <Text style={[styles.timerBadge, { color: colors.warning, fontSize: typography.xs }]}>
                Auto-clears in {clipboardTimer}s
              </Text>
            )}
          </View>

          <View style={styles.fieldValueRow}>
            <Text
              style={[
                styles.fieldValue,
                {
                  color: colors.textPrimary,
                  fontSize: typography.base,
                  fontFamily: showPassword ? 'monospace' : undefined,
                  letterSpacing: showPassword ? 0.5 : 2,
                },
              ]}
              selectable={showPassword}
            >
              {showPassword ? item.password : '••••••••••••••••'}
            </Text>

            <View style={styles.pwdActions}>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={[styles.copyIconBtn, { backgroundColor: colors.bgSecondary, marginRight: 6 }]}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={16} color={colors.textSecondary} />
                ) : (
                  <Eye size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleCopy('password', item.password)}
                style={[styles.copyIconBtn, { backgroundColor: copiedField === 'password' ? colors.successBg : colors.bgSecondary }]}
                accessibilityRole="button"
                accessibilityLabel="Copy password"
              >
                {copiedField === 'password' ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <Copy size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Website URL */}
        {item.url && (
          <Card variant="outlined" style={[styles.fieldCard, { marginBottom: spacing.sm }]}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              WEBSITE
            </Text>
            <View style={styles.fieldValueRow}>
              <Text
                style={[styles.fieldValue, { color: accent.primary, fontSize: typography.sm }]}
                numberOfLines={1}
              >
                {item.url}
              </Text>
              <TouchableOpacity
                onPress={handleOpenUrl}
                style={[styles.openBtn, { backgroundColor: accent.primaryBgLight }]}
                accessibilityRole="button"
                accessibilityLabel="Open website in browser"
              >
                <ExternalLink size={14} color={accent.primary} style={{ marginRight: 4 }} />
                <Text style={{ color: accent.primary, fontSize: typography.xs, fontWeight: '600' }}>
                  Open
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Encrypted Notes */}
        {item.notes && (
          <Card variant="outlined" style={[styles.fieldCard, { marginBottom: spacing.sm }]}>
            <Text style={[styles.fieldLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
              ENCRYPTED NOTES
            </Text>
            <Text style={[styles.notesText, { color: colors.textSecondary, fontSize: typography.sm, marginTop: 4 }]}>
              {item.notes}
            </Text>
          </Card>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {item.tags.map((t) => (
              <Tag key={t} label={t} size="sm" />
            ))}
          </View>
        )}

        {/* Timestamps */}
        <View style={styles.timestampRow}>
          <Clock size={12} color={colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[styles.timestampText, { color: colors.textMuted, fontSize: typography.xs }]}>
            Last updated {new Date(item.updated_at).toLocaleString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={[styles.bottomButtons, { marginTop: spacing.md }]}>
          <Button
            title="Delete"
            variant="danger"
            iconLeft={<Trash2 size={16} color="#FFFFFF" />}
            onPress={handleDelete}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Button
            title="Edit Credential"
            variant="primary"
            iconLeft={<Edit2 size={16} color="#FFFFFF" />}
            onPress={() => {
              onClose();
              onEdit(item);
            }}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  folderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  folderDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  folderText: {
    fontWeight: '600',
  },
  favoriteBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldCard: {
    padding: 12,
  },
  fieldLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  fieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  fieldValue: {
    flex: 1,
    fontWeight: '500',
  },
  copyIconBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pwdHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerBadge: {
    fontWeight: '600',
  },
  pwdActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  notesText: {
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  timestampText: {},
  bottomButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
