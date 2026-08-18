/**
 * Life OS & Vault - Change Master Password Modal
 * Re-encrypts entire database with new derived key and issues new emergency recovery code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Lock,
  Key,
  Check,
  Copy,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Input, Button, Card } from '../ui';
import { CryptoService } from '../../services/cryptoService';

export interface ChangeMasterPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangeMasterPasswordModal: React.FC<ChangeMasterPasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { changeMasterPassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newRecoveryCode, setNewRecoveryCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setNewRecoveryCode(null);
    setCopied(false);
    setError('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const strengthInfo = CryptoService.evaluatePasswordStrength(newPassword);
  const passwordScore = strengthInfo.score;

  const handleSubmit = async () => {
    if (!currentPassword) {
      setError('Please enter your current master password');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { newRecoveryCode } = await changeMasterPassword(currentPassword, newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setNewRecoveryCode(newRecoveryCode);
    } catch (e: any) {
      setError(e?.message || 'Failed to change master password');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!newRecoveryCode) return;
    await Clipboard.setStringAsync(newRecoveryCode);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={newRecoveryCode ? 'Save New Recovery Code' : 'Change Master Password'}
      subtitle={
        newRecoveryCode
          ? 'Your master password changed. Save your new emergency key.'
          : 'All vault items, notes, and tasks will be re-encrypted.'
      }
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {newRecoveryCode ? (
          <View>
            <View
              style={[
                styles.warningBanner,
                { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.md },
              ]}
            >
              <AlertTriangle size={18} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, { color: colors.warning, fontSize: typography.xs }]}>
                Old recovery codes are now invalid. Store this new 8-word key in a safe offline location.
              </Text>
            </View>

            {/* Recovery Code Display */}
            <Card variant="outlined" style={[styles.codeBox, { backgroundColor: colors.bgTertiary }]}>
              <Text
                style={[
                  styles.codeText,
                  { color: colors.textPrimary, fontSize: typography.base, fontFamily: 'monospace' },
                ]}
                selectable
              >
                {newRecoveryCode}
              </Text>
            </Card>

            <Button
              title={copied ? 'Copied to Clipboard' : 'Copy Recovery Code'}
              iconLeft={copied ? <Check size={16} color="#FFFFFF" /> : <Copy size={16} color="#FFFFFF" />}
              onPress={handleCopyCode}
              variant={copied ? 'secondary' : 'primary'}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />

            <Button
              title="I Have Saved My Code"
              variant="outline"
              onPress={handleClose}
              fullWidth
            />
          </View>
        ) : (
          <View>
            <Input
              label="Current Master Password *"
              placeholder="Enter current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Input
              label="New Master Password *"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            {/* Strength Bar */}
            {newPassword.length > 0 && (
              <View style={styles.strengthWrapper}>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      {
                        width: `${(passwordScore / 4) * 100}%`,
                        backgroundColor:
                          passwordScore <= 1
                            ? colors.danger
                            : passwordScore <= 2
                            ? colors.warning
                            : colors.success,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthText,
                    {
                      color:
                        passwordScore <= 1
                          ? colors.danger
                          : passwordScore <= 2
                          ? colors.warning
                          : colors.success,
                      fontSize: typography.xs,
                    },
                  ]}
                >
                  Strength: {passwordScore <= 1 ? 'Weak' : passwordScore <= 2 ? 'Fair' : passwordScore === 3 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            <Input
              label="Confirm New Password *"
              placeholder="Re-type new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              errorText={error}
            />

            <Button
              title="Re-encrypt & Change Password"
              onPress={handleSubmit}
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
  strengthWrapper: {
    marginBottom: 12,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthBarFill: {
    height: '100%',
  },
  strengthText: {
    fontWeight: '600',
  },
  warningBanner: {
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
  codeBox: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  codeText: {
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
});
