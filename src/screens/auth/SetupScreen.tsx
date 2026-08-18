/**
 * Life OS & Vault - Master Password Setup Wizard
 * First-launch onboarding with Master Password, Strength Meter, Recovery Code confirmation, and Biometrics
 */

import React, { useState, useMemo } from 'react';
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
import { ShieldCheck, Copy, Check, Lock, KeyRound, Fingerprint, Info } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Input, Card, ProgressBar, Switch } from '../../components/ui';
import { CryptoService } from '../../services/cryptoService';

export const SetupScreen: React.FC = () => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { setupMasterPassword, biometricsAvailable } = useAuth();

  // Wizard state: 1 = Password, 2 = Recovery Code, 3 = Confirmation & Biometrics
  const [step, setStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(true);
  const [error, setError] = useState('');
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const strength = useMemo(() => CryptoService.evaluatePasswordStrength(password), [password]);

  const strengthProgress = strength.score / 4;
  const strengthStatus =
    strength.score <= 1 ? 'danger' : strength.score === 2 ? 'warning' : 'success';

  const handleStep1Next = () => {
    setError('');

    if (!password || password.length < 8) {
      setError('Master password must be at least 8 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    if (strength.score < 2) {
      setError('Please choose a stronger master password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    // Pre-generate recovery code for preview step
    const code = CryptoService.generateRecoveryCode();
    setGeneratedRecoveryCode(code);
    setStep(2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleCopyRecoveryCode = async () => {
    await Clipboard.setStringAsync(generatedRecoveryCode);
    setCopiedCode(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCompleteSetup = async () => {
    if (!confirmedSaved) {
      setError('Please confirm that you have securely saved your recovery code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await setupMasterPassword(password, enableBiometrics && biometricsAvailable);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'Failed to initialize vault');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsLoading(false);
    }
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
        {/* Header Branding */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: accent.primaryBgDark, borderColor: accent.primary },
            ]}
          >
            <ShieldCheck size={38} color={accent.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.xl }]}>
            Welcome to Life OS & Vault
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary, fontSize: typography.sm }]}>
            {step === 1 ? 'Step 1 of 2: Create Master Password' : 'Step 2 of 2: Emergency Recovery Code'}
          </Text>
        </View>

        {step === 1 ? (
          <Card variant="elevated" style={styles.card}>
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.textPrimary, fontSize: typography.md, marginBottom: spacing.xs },
              ]}
            >
              Set Master Encryption Password
            </Text>
            <Text
              style={[
                styles.description,
                { color: colors.textTertiary, fontSize: typography.sm, marginBottom: spacing.md },
              ]}
            >
              Your master password derives your local AES-256 encryption key. It never leaves your device.
            </Text>

            <Input
              label="Master Password"
              placeholder="Enter master password (min 8 chars)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              isPassword
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
            />

            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthHeader}>
                  <Text style={[styles.strengthLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    Strength: <Text style={{ fontWeight: '700' }}>{strength.label}</Text>
                  </Text>
                  <Text style={[styles.strengthFeedback, { color: colors.textTertiary, fontSize: typography.xs }]}>
                    {strength.feedback}
                  </Text>
                </View>
                <ProgressBar
                  progress={strengthProgress}
                  status={strengthStatus}
                  height={6}
                  style={{ marginTop: 6, marginBottom: 12 }}
                />
              </View>
            )}

            <Input
              label="Confirm Master Password"
              placeholder="Re-enter master password"
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
              title="Continue to Recovery Code"
              onPress={handleStep1Next}
              variant="primary"
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        ) : (
          <Card variant="elevated" style={styles.card}>
            <View style={[styles.warningBox, { backgroundColor: colors.warningBg, borderRadius: radius.md }]}>
              <Info size={20} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.warningBoxText, { color: colors.warning, fontSize: typography.xs }]}>
                If you forget your master password, this recovery code is the ONLY way to regain access to your vault.
              </Text>
            </View>

            <Text
              style={[
                styles.sectionHeading,
                { color: colors.textPrimary, fontSize: typography.md, marginTop: spacing.md, marginBottom: spacing.xs },
              ]}
            >
              Your Recovery Code
            </Text>

            {/* Recovery Code Box */}
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
                {generatedRecoveryCode}
              </Text>

              <TouchableOpacity
                onPress={handleCopyRecoveryCode}
                style={[
                  styles.copyBtn,
                  { backgroundColor: copiedCode ? colors.successBg : colors.bgTertiary },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Copy recovery code"
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

            {/* Biometrics Toggle if available */}
            {biometricsAvailable && (
              <View style={[styles.switchRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1, marginTop: spacing.lg }]}>
                <Switch
                  label="Enable Biometric Unlock"
                  subtitle="Use Face ID or Fingerprint for fast daily unlock"
                  value={enableBiometrics}
                  onValueChange={setEnableBiometrics}
                />
              </View>
            )}

            {/* Checkbox Confirmation */}
            <TouchableOpacity
              onPress={() => setConfirmedSaved(!confirmedSaved)}
              style={styles.checkboxRow}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmedSaved }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: confirmedSaved ? accent.primary : colors.borderMedium,
                    backgroundColor: confirmedSaved ? accent.primary : 'transparent',
                    borderRadius: radius.xs,
                  },
                ]}
              >
                {confirmedSaved && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
                I have written down or safely backed up my recovery code.
              </Text>
            </TouchableOpacity>

            {error ? (
              <Text style={[styles.errorText, { color: colors.danger, fontSize: typography.xs }]}>
                {error}
              </Text>
            ) : null}

            <View style={styles.buttonGroup}>
              <Button
                title="Back"
                onPress={() => setStep(1)}
                variant="secondary"
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Complete Setup"
                onPress={handleCompleteSetup}
                variant="primary"
                loading={isLoading}
                disabled={!confirmedSaved}
                style={{ flex: 2 }}
              />
            </View>
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
    justifyContent: 'center',
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    maxWidth: 480,
    alignSelf: 'center',
  },
  sectionHeading: {
    fontWeight: '700',
  },
  description: {
    lineHeight: 20,
  },
  strengthContainer: {
    marginBottom: 8,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontWeight: '500',
  },
  strengthFeedback: {
    fontStyle: 'italic',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  warningBoxText: {
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
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
  switchRow: {
    paddingTop: 12,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxLabel: {
    flex: 1,
    fontWeight: '500',
    lineHeight: 18,
  },
  errorText: {
    marginBottom: 12,
    fontWeight: '500',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
