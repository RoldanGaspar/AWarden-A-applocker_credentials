/**
 * Life OS & Vault - CSV Export Modal Component
 * Exports unencrypted CSV copies of Financial Transactions and Safe Notes for external spreadsheet analysis
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FileSpreadsheet, FileText, ArrowRight, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button, Card } from '../ui';
import { BackupService } from '../../services/backupService';

export interface CsvExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({ visible, onClose }) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { masterKey } = useAuth();

  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);

  const handleExportTransactions = async () => {
    if (!masterKey) return;
    setLoadingTx(true);
    try {
      await BackupService.exportTransactionsCsv(masterKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export transactions');
    } finally {
      setLoadingTx(false);
    }
  };

  const handleExportNotes = async () => {
    if (!masterKey) return;
    setLoadingNotes(true);
    try {
      await BackupService.exportNotesCsv(masterKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message || 'Could not export notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Export CSV Spreadsheets"
      subtitle="Export decrypted records for offline spreadsheets & analysis"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {/* Transactions Card */}
        <Card variant="outlined" style={[styles.exportCard, { marginBottom: spacing.md }]}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.bgTertiary, borderRadius: radius.md }]}>
              <FileSpreadsheet size={24} color={accent.primary} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.base }]}>
                Financial Transactions
              </Text>
              <Text style={[styles.desc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Includes date, amount, currency, category, payee, and notes.
              </Text>
            </View>
          </View>
          <Button
            title="Export Transactions CSV"
            iconLeft={<Download size={16} color="#FFFFFF" />}
            onPress={handleExportTransactions}
            loading={loadingTx}
            variant="primary"
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        {/* Notes Card */}
        <Card variant="outlined" style={styles.exportCard}>
          <View style={styles.row}>
            <View style={[styles.iconBox, { backgroundColor: colors.bgTertiary, borderRadius: radius.md }]}>
              <FileText size={24} color={accent.primary} />
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.base }]}>
                Safe Markdown Notes
              </Text>
              <Text style={[styles.desc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Includes note title, markdown content, tags, and timestamps.
              </Text>
            </View>
          </View>
          <Button
            title="Export Notes CSV"
            iconLeft={<Download size={16} color="#FFFFFF" />}
            onPress={handleExportNotes}
            loading={loadingNotes}
            variant="primary"
            fullWidth
            style={{ marginTop: spacing.sm }}
          />
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  exportCard: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  desc: {
    marginTop: 2,
    lineHeight: 16,
  },
});
