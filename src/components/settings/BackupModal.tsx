/**
 * Life OS & Vault - Backup & Restore Modal Component
 * AES-256 encrypted .vault backup creation and document picker restoration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  ShieldCheck,
  Download,
  Upload,
  FileCheck,
  Lock,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Input, Button, Card } from '../ui';
import { BackupService } from '../../services/backupService';
import { dbService } from '../../services/db';

export interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  visible,
  onClose,
  onDataRestored,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { lockNow } = useAuth();

  const [mode, setMode] = useState<'create' | 'restore'>('create');
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmBackupPassword, setConfirmBackupPassword] = useState('');

  const [selectedFileUri, setSelectedFileUri] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [restorePassword, setRestorePassword] = useState('');

  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      loadBackupTime();
      setBackupPassword('');
      setConfirmBackupPassword('');
      setSelectedFileUri(null);
      setSelectedFileName(null);
      setRestorePassword('');
      setError('');
    }
  }, [visible]);

  const loadBackupTime = async () => {
    try {
      const ts = await dbService.getSetting('last_backup_timestamp');
      if (ts) {
        setLastBackupTime(new Date(parseInt(ts, 10)).toLocaleString());
      }
    } catch (e) {
      console.warn('Failed to load backup timestamp:', e);
    }
  };

  const handleCreateBackup = async () => {
    if (backupPassword.length < 8) {
      setError('Backup password must be at least 8 characters long');
      return;
    }

    if (backupPassword !== confirmBackupPassword) {
      setError('Backup passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await BackupService.createEncryptedBackup(backupPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await loadBackupTime();
      Alert.alert(
        'Backup Created',
        'Your encrypted .vault backup file has been generated and ready to be saved securely.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFileUri(asset.uri);
        setSelectedFileName(asset.name);
        setError('');
        Haptics.selectionAsync().catch(() => {});
      }
    } catch (e: any) {
      setError('Failed to select file from storage');
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFileUri) {
      setError('Please select a .vault backup file first');
      return;
    }

    if (!restorePassword) {
      setError('Please enter the backup password used during creation');
      return;
    }

    Alert.alert(
      'Restore Entire Database?',
      'Restoring will replace all current data with the contents of the backup. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Data',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setError('');

            try {
              await BackupService.restoreEncryptedBackup(selectedFileUri, restorePassword);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert(
                'Restore Complete',
                'Your vault and databases have been restored successfully. The app will now lock for security.',
                [
                  {
                    text: 'Lock Vault',
                    onPress: () => {
                      onClose();
                      if (onDataRestored) onDataRestored();
                      lockNow();
                    },
                  },
                ]
              );
            } catch (e: any) {
              setError(e?.message || 'Failed to restore backup');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={mode === 'create' ? 'Create Encrypted Backup' : 'Restore from Backup'}
      subtitle="Encrypted .vault format with zero-cloud security"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {/* Mode Segmented Control */}
        <View style={[styles.modeToggle, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setMode('create');
              setError('');
            }}
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'create' ? accent.primary : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'create' }}
          >
            <Download size={14} color={mode === 'create' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'create' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              Export Backup (.vault)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setMode('restore');
              setError('');
            }}
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === 'restore' ? accent.primary : 'transparent',
                borderRadius: radius.sm,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === 'restore' }}
          >
            <Upload size={14} color={mode === 'restore' ? '#FFFFFF' : colors.textSecondary} />
            <Text
              style={[
                styles.modeBtnText,
                { color: mode === 'restore' ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
              ]}
            >
              Restore Backup
            </Text>
          </TouchableOpacity>
        </View>

        {lastBackupTime && (
          <View style={styles.lastBackupBox}>
            <Clock size={12} color={colors.textTertiary} style={{ marginRight: 4 }} />
            <Text style={[styles.lastBackupText, { color: colors.textTertiary, fontSize: typography.xs }]}>
              Last backup created: {lastBackupTime}
            </Text>
          </View>
        )}

        {mode === 'create' ? (
          <View>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle, borderRadius: radius.md },
              ]}
            >
              <ShieldCheck size={18} color={accent.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: typography.xs }]}>
                Backups are encrypted using AES-256-CBC with a standalone backup password. Keep this password safe—it cannot be recovered.
              </Text>
            </View>

            <Input
              label="Backup Password *"
              placeholder="Minimum 8 characters"
              value={backupPassword}
              onChangeText={setBackupPassword}
              secureTextEntry
            />

            <Input
              label="Confirm Backup Password *"
              placeholder="Re-type backup password"
              value={confirmBackupPassword}
              onChangeText={setConfirmBackupPassword}
              secureTextEntry
              errorText={error}
            />

            <Button
              title="Create & Export Backup"
              onPress={handleCreateBackup}
              loading={loading}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          <View>
            <View
              style={[
                styles.warningCard,
                { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.md },
              ]}
            >
              <AlertTriangle size={18} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, { color: colors.warning, fontSize: typography.xs }]}>
                Restoring overwrites all current notes, tasks, credentials, and transactions.
              </Text>
            </View>

            <Button
              title={selectedFileName ? `Selected: ${selectedFileName}` : 'Select .vault File'}
              iconLeft={<FileCheck size={16} color={selectedFileName ? colors.success : colors.textPrimary} />}
              onPress={handlePickDocument}
              variant="outline"
              fullWidth
              style={{ marginBottom: spacing.md }}
            />

            <Input
              label="Backup Password *"
              placeholder="Enter password used when creating backup"
              value={restorePassword}
              onChangeText={setRestorePassword}
              secureTextEntry
              errorText={error}
            />

            <Button
              title="Decrypt & Restore Database"
              onPress={handleRestoreBackup}
              loading={loading}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    padding: 3,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  modeBtnText: {
    fontWeight: '700',
  },
  lastBackupBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'center',
  },
  lastBackupText: {
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
});
