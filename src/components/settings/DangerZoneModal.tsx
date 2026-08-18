/**
 * Life OS & Vault - Danger Zone Wipe Modal
 * Double confirmation requiring typed confirmation to wipe database and hardware keys
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AlertOctagon, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Input, Button, Card } from '../ui';

export interface DangerZoneModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DangerZoneModal: React.FC<DangerZoneModalProps> = ({ visible, onClose }) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { wipeVault } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleWipe = async () => {
    if (!isConfirmed) {
      setError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      await wipeVault();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to wipe database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Wipe Vault & Reset App"
      subtitle="Permanent, irreversible data destruction"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        <View
          style={[
            styles.warningCard,
            { backgroundColor: colors.dangerBg, borderColor: colors.danger, borderRadius: radius.md },
          ]}
        >
          <AlertOctagon size={20} color={colors.danger} style={{ marginRight: 10 }} />
          <Text style={[styles.warningText, { color: colors.danger, fontSize: typography.xs }]}>
            This action will permanently delete all encrypted credentials, financial records, notes, tasks, folders, and cryptographic keys.
          </Text>
        </View>

        <Input
          label='Type "DELETE" to confirm *'
          placeholder="DELETE"
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          errorText={error}
        />

        <Button
          title="Permanently Destroy All Data"
          iconLeft={<Trash2 size={16} color="#FFFFFF" />}
          onPress={handleWipe}
          loading={loading}
          disabled={!isConfirmed}
          variant="danger"
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
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
    fontWeight: '700',
  },
});
