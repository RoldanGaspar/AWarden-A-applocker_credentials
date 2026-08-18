/**
 * Life OS & Vault - Emergency Recovery Code Modal
 * Allows viewing and regenerating the 8-word CSPRNG recovery code after password verification
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
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Modal, Input, Button, Card } from '../ui';

export interface RecoveryCodeModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RecoveryCodeModal: React.FC<RecoveryCodeModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { regenerateRecoveryCode } = useAuth();

  const [password, setPassword] = useState('');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setPassword('');
    setActiveCode(null);
    setCopied(false);
    setError('');
    onClose();
  };

  const handleGenerate = async () => {
    if (!password) {
      setError('Please enter your master password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { newRecoveryCode } = await regenerateRecoveryCode(password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setActiveCode(newRecoveryCode);
    } catch (e: any) {
      setError(e?.message || 'Failed to regenerate recovery code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!activeCode) return;
    await Clipboard.setStringAsync(activeCode);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal
      visible={visible}
      onClose={handleClose}
      title={activeCode ? 'Emergency Recovery Key' : 'Verify Master Password'}
      subtitle={
        activeCode
          ? 'Store this 8-word key in an offline vault. It resets your account if locked out.'
          : 'Enter master password to generate a fresh recovery key'
      }
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {activeCode ? (
          <View>
            <View
              style={[
                styles.alertBox,
                { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.md },
              ]}
            >
              <AlertTriangle size={18} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.alertText, { color: colors.warning, fontSize: typography.xs }]}>
                Any previous recovery code has been invalidated. Only this new key can reset your master password.
              </Text>
            </View>

            <Card variant="outlined" style={[styles.codeBox, { backgroundColor: colors.bgTertiary }]}>
              <Text
                style={[
                  styles.codeText,
                  { color: colors.textPrimary, fontSize: typography.base, fontFamily: 'monospace' },
                ]}
                selectable
              >
                {activeCode}
              </Text>
            </Card>

            <Button
              title={copied ? 'Copied to Clipboard' : 'Copy Recovery Key'}
              iconLeft={copied ? <Check size={16} color="#FFFFFF" /> : <Copy size={16} color="#FFFFFF" />}
              onPress={handleCopy}
              variant={copied ? 'secondary' : 'primary'}
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />

            <Button
              title="Done"
              variant="outline"
              onPress={handleClose}
              fullWidth
            />
          </View>
        ) : (
          <View>
            <Input
              label="Master Password *"
              placeholder="Confirm your master password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              errorText={error}
            />

            <Button
              title="Generate New Recovery Key"
              iconLeft={<RefreshCw size={16} color="#FFFFFF" />}
              onPress={handleGenerate}
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
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
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
