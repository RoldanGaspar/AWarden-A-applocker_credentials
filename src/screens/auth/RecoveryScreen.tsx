/**
 * Life OS & Vault - Emergency Recovery Screen
 * Allows vault unlock and master password reset using the offline recovery code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { KeyRound, ArrowLeft, Lock, CheckCircle, Copy, Check } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Input, Card, ProgressBar } from '../../components/ui';
import { CryptoService } from '../../services/cryptoService';

export interface RecoveryScreenProps {
  onBackToLock: () => void;
}

export const RecoveryScreen: React.FC<RecoveryScreenProps> = ({ onBackToLock }) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { unlockWithRecoveryCode, biometricsAvailable } = useAuth();

  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [newGeneratedCode, setNewGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const strength = CryptoService.evaluatePasswordStrength(newPassword);

  const handleResetPassword = async () => {
    setError('');

    const formattedCode = recoveryCode.trim().toUpperCase();
    if (!formattedCode) {
      setError('Please enter your recovery code');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    setIsLoading(true);

    try {
      const result = await unlockWithRecoveryCode(
        formattedCode,
        newPassword,
        biometricsAvailable
      );
      setNewGeneratedCode(result.newRecoveryCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'Invalid recovery code. Please check and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyNewCode = async () => {
    if (!newGeneratedCode) return;
    await Clipboard.setStringAsync(newGeneratedCode);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity
          onPress={onBackToLock}
          style={[styles.backButton, { minHeight: spacing.minTouchTarget }]}
          accessibilityRole="button"
          accessibilityLabel="Back to Lock Screen"
        >
          <ArrowLeft size={20} color={colors.textSecondary} />
          <Text
            style={[
              styles.backText,
              { color: colors.textSecondary, fontSize: typography.sm, marginLeft: spacing.xs },
            ]}
          >
            Back to Lock Screen
          </Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: accent.primaryBgDark, borderColor: accent.primary },
            ]}
          >
            <KeyRound size={36} color={accent.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.xl }]}>
            Vault Recovery
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary, fontSize: typography.sm }]}>
            Reset Master Password with Recovery Code
          </Text>
        </View>

        {newGeneratedCode ? (
          <Card variant="elevated" style={styles.card}>
            <View style={styles.successHeader}>
              <CheckCircle size={36} color={colors.success} />
              <Text
                style={[
                  styles.successTitle,
                  { color: colors.textPrimary, fontSize: typography.lg, marginTop: spacing.sm },
                ]}
              >
                Vault Successfully Recovered!
              </Text>
              <Text
                style={[
                  styles.successDesc,
                  { color: colors.textTertiary, fontSize: typography.sm, marginVertical: spacing.xs },
                ]}
              >
                Your new master password is now active. Here is your NEW replacement recovery code. The old code is now void.
              </Text>
            </View>

            <View
              style={[
                styles.codeBox,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: accent.primary,
                  borderRadius: radius.md,
                },
              ]}
            >
              <Text
                style={[
                  styles.codeText,
                  { color: accent.primary, fontSize: typography.md },
                ]}
                selectable
              >
                {newGeneratedCode}
              </Text>

              <TouchableOpacity
                onPress={handleCopyNewCode}
                style={[
                  styles.copyBtn,
                  { backgroundColor: copiedCode ? colors.successBg : colors.bgTertiary },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Copy new recovery code"
              >
                {copiedCode ? (
                  <Check size={16} color={colors.success} />
                ) : (
                  <Copy size={16} color={colors.textPrimary} />
                )}
                <Text
                  style={[
                    styles.copyBtnText,
                    { color: copiedCode ? colors.success : colors.textPrimary, fontSize: typography.xs },
                  ]}
                >
                  {copiedCode ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            <Button
              title="Enter Life OS"
              onPress={onBackToLock}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          </Card>
        ) : (
          <Card variant="elevated" style={styles.card}>
            <Input
              label="Emergency Recovery Code"
              placeholder="VAULT-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              value={recoveryCode}
              onChangeText={(text) => {
                setRecoveryCode(text);
                if (error) setError('');
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              leftIcon={<KeyRound size={18} color={colors.textSecondary} />}
            />

            <Input
              label="New Master Password"
              placeholder="Enter new master password"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (error) setError('');
              }}
              isPassword
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
            />

            {newPassword.length > 0 && (
              <ProgressBar
                progress={strength.score / 4}
                status={strength.score <= 1 ? 'danger' : strength.score === 2 ? 'warning' : 'success'}
                height={6}
                style={{ marginTop: -8, marginBottom: 12 }}
              />
            )}

            <Input
              label="Confirm New Master Password"
              placeholder="Re-enter new master password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              isPassword
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
              errorText={error}
            />

            <Button
              title="Verify Code & Reset Password"
              onPress={handleResetPassword}
              variant="primary"
              loading={isLoading}
              fullWidth
              style={{ marginTop: spacing.xs }}
            />
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backText: {
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  successHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  successDesc: {
    textAlign: 'center',
    lineHeight: 20,
  },
  codeBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  codeText: {
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 12,
    textAlign: 'center',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  copyBtnText: {
    fontWeight: '600',
  },
});
