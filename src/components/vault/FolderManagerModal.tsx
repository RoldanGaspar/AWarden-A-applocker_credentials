/**
 * Life OS & Vault - Folder Management Modal
 * Allows creating, editing, and deleting credential & note folders
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
  Folder as FolderIcon,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Modal, Button, Input, Card } from '../ui';
import { dbService } from '../../services/db';
import { Folder } from '../../types/models';

export interface FolderManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onFoldersChanged: () => void;
}

const FOLDER_COLORS = [
  '#3B82F6', // Slate Blue
  '#8B5CF6', // Dusk Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#C86446', // Terracotta Clay
  '#4A7C59', // Sage Green
  '#64748B', // Slate
];

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  visible,
  onClose,
  onFoldersChanged,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(FOLDER_COLORS[0]);
  const [error, setError] = useState('');

  const loadFolders = async () => {
    try {
      const data = await dbService.getFolders('vault');
      setFolders(data);
    } catch (e) {
      console.warn('Failed to load folders:', e);
    }
  };

  useEffect(() => {
    if (visible) {
      loadFolders();
      setIsCreating(false);
      setEditingFolderId(null);
      setFolderName('');
      setError('');
    }
  }, [visible]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingFolderId(null);
    setFolderName('');
    setSelectedColor(FOLDER_COLORS[folders.length % FOLDER_COLORS.length]);
    setError('');
  };

  const handleStartEdit = (f: Folder) => {
    setEditingFolderId(f.id);
    setIsCreating(false);
    setFolderName(f.name);
    setSelectedColor(f.color);
    setError('');
  };

  const handleSave = async () => {
    if (!folderName.trim()) {
      setError('Please enter a folder name');
      return;
    }

    try {
      if (isCreating) {
        const newFolder: Folder = {
          id: `folder_${Date.now()}`,
          name: folderName.trim(),
          type: 'vault',
          color: selectedColor,
          icon: 'Folder',
        };
        await dbService.createFolder(newFolder);
      } else if (editingFolderId) {
        const updated: Folder = {
          id: editingFolderId,
          name: folderName.trim(),
          type: 'vault',
          color: selectedColor,
          icon: 'Folder',
        };
        await dbService.updateFolder(updated);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setIsCreating(false);
      setEditingFolderId(null);
      setFolderName('');
      await loadFolders();
      onFoldersChanged();
    } catch (e: any) {
      setError(e?.message || 'Failed to save folder');
    }
  };

  const handleDelete = (folder: Folder) => {
    Alert.alert(
      'Delete Folder?',
      `Are you sure you want to delete "${folder.name}"? Credentials in this folder will not be deleted, but will become unassigned.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await dbService.deleteFolder(folder.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            await loadFolders();
            onFoldersChanged();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Manage Folders"
      subtitle="Organize your credentials by category"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {isCreating || editingFolderId ? (
          <Card variant="outlined" style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
                {isCreating ? 'Create New Folder' : 'Edit Folder'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsCreating(false);
                  setEditingFolderId(null);
                }}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing"
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Input
              label="Folder Name"
              placeholder="e.g. Finance, Work, Personal"
              value={folderName}
              onChangeText={setFolderName}
              errorText={error}
            />

            <Text style={[styles.colorLabel, { color: colors.textSecondary, fontSize: typography.sm, marginBottom: 8 }]}>
              Folder Color
            </Text>
            <View style={styles.colorGrid}>
              {FOLDER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: c,
                      borderColor: selectedColor === c ? '#FFFFFF' : 'transparent',
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${c}`}
                >
                  {selectedColor === c && <Check size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title={isCreating ? 'Create Folder' : 'Save Changes'}
              onPress={handleSave}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <Button
            title="Create New Folder"
            onPress={handleStartCreate}
            iconLeft={<Plus size={18} color="#FFFFFF" />}
            variant="primary"
            fullWidth
            style={{ marginBottom: spacing.md }}
          />
        )}

        <Text
          style={[
            styles.listHeading,
            { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.xs },
          ]}
        >
          EXISTING FOLDERS ({folders.length})
        </Text>

        <ScrollView style={{ maxHeight: 300 }}>
          {folders.map((f) => (
            <View
              key={f.id}
              style={[
                styles.folderRow,
                {
                  borderBottomColor: colors.borderSubtle,
                  borderBottomWidth: 1,
                  minHeight: spacing.minTouchTarget,
                },
              ]}
            >
              <View style={[styles.folderColorBox, { backgroundColor: f.color, borderRadius: radius.xs }]}>
                <FolderIcon size={16} color="#FFFFFF" />
              </View>

              <Text style={[styles.folderName, { color: colors.textPrimary, fontSize: typography.base }]}>
                {f.name}
              </Text>

              <View style={styles.rowActions}>
                <TouchableOpacity
                  onPress={() => handleStartEdit(f)}
                  style={[styles.actionBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit folder ${f.name}`}
                >
                  <Edit2 size={16} color={colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(f)}
                  style={[styles.actionBtn, { minWidth: spacing.minTouchTarget, minHeight: spacing.minTouchTarget }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete folder ${f.name}`}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  formCard: {
    padding: 16,
    marginBottom: 16,
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
  colorLabel: {
    fontWeight: '600',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  listHeading: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  folderColorBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  folderName: {
    flex: 1,
    fontWeight: '600',
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
