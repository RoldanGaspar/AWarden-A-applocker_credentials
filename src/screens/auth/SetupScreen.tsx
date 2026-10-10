/**
 * AWarden - Security Setup Wizard
 * 3-Step Guided Security Narrative with AWarden Guardian Mark
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
} from 'react-native';
import {
  ShieldCheck,
  Copy,
  Check,
  Lock,
  KeyRound,
  Fingerprint,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Input, Card, ProgressBar, Switch, AWardenMark } from '../../components/ui';
import { CryptoService } from '../../services/cryptoService';

export const SetupScreen: React.FC = () => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const { setupMasterPassword, biometricsAvailable } = useAuth();

  // Wizard state: 1 = Password, 2 = Biometrics & Hardware, 3 = Emergency Recovery Cipher
  const [step, setStep] = useState<1 | 2 | 3>(1);
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

    setStep(2);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const handleStep2Next = () => {
    setError('');
    // Pre-generate recovery code for preview step
    const code = CryptoService.generateRecoveryCode();
    setGeneratedRecoveryCode(code);
    setStep(3);
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
      setError('Please confirm that you have securely saved your emergency recovery cipher.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await setupMasterPassword(password, enableBiometrics && biometricsAvailable);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      setError(e?.message || 'Failed to initialize AWarden vault');
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
        {/* Header AWarden Branding */}
        <View style={styles.header}>
          <View style={styles.owlWrapper}>
            <AWardenMark size={116} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.xxl }]}>
            AWarden
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary, fontSize: typography.sm }]}>
            {step === 1
              ? 'Act 1: Awaken Your Guardian'
              : step === 2
              ? 'Act 2: Hardware Shield Binding'
              : 'Act 3: The Ancient Cipher'}
          </Text>

          {/* Progress Dots */}
          <View style={styles.stepDotsRow}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: step >= s ? accent.primary : colors.bgTertiary,
                    width: step === s ? 24 : 8,
                    borderRadius: radius.full,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {/* STEP 1: Master Password */}
        {step === 1 && (
          <Card variant="elevated" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              Create Master Password
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.md }]}>
              AWarden derives an AES-256 key from this password. It never leaves your device.
            </Text>

            <Input
              label="Master Password *"
              placeholder="Minimum 8 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError('');
              }}
              isPassword
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
            />

            {/* Password Strength Meter */}
            {password.length > 0 && (
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={[styles.strengthLabel, { color: colors.textTertiary, fontSize: typography.xs }]}>
                    Key Entropy: {strength.label}
                  </Text>
                  <Text style={[styles.strengthScore, { color: colors.textSecondary, fontSize: typography.xs }]}>
                    {Math.round(strengthProgress * 100)}%
                  </Text>
                </View>
                <ProgressBar progress={strengthProgress} status={strengthStatus} style={{ height: 5 }} />
                <Text style={[styles.strengthFeedback, { color: colors.textMuted, fontSize: 11 }]}>
                  {strength.feedback}
                </Text>
              </View>
            )}

            <Input
              label="Confirm Master Password *"
              placeholder="Re-enter your master password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
              isPassword
              leftIcon={<Lock size={18} color={colors.textSecondary} />}
              errorText={error}
              returnKeyType="next"
              onSubmitEditing={handleStep1Next}
            />

            <Button
              title="Continue to Hardware Shield"
              onPress={handleStep1Next}
              variant="primary"
              fullWidth
              iconRight={<ArrowRight size={16} color="#FFFFFF" />}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
        )}

        {/* STEP 2: Biometrics & Hardware */}
        {step === 2 && (
          <Card variant="elevated" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              Hardware Security Binding
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.md }]}>
              Bind your encryption key to the device's secure hardware enclave.
            </Text>

            {/* Trust Checklist */}
            <View style={[styles.trustBox, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
              <View style={styles.trustItem}>
                <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={[styles.trustText, { color: colors.textPrimary, fontSize: typography.xs }]}>
                  100% Zero-Cloud Storage (SQLite + WAL)
                </Text>
              </View>
              <View style={styles.trustItem}>
                <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={[styles.trustText, { color: colors.textPrimary, fontSize: typography.xs }]}>
                  PBKDF2 Key Derivation (30k Iterations)
                </Text>
              </View>
              <View style={styles.trustItem}>
                <CheckCircle2 size={16} color={colors.success} style={{ marginRight: 8 }} />
                <Text style={[styles.trustText, { color: colors.textPrimary, fontSize: typography.xs }]}>
                  Hardware Keychain Protection
                </Text>
              </View>
            </View>

            {biometricsAvailable ? (
              <View style={[styles.switchRow, { borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
                <View style={styles.switchInfo}>
                  <Text style={[styles.switchTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                    Enable Biometric Unlock
                  </Text>
                  <Text style={[styles.switchDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                    Quickly unlock using Face ID or Fingerprint
                  </Text>
                </View>
                <Switch value={enableBiometrics} onValueChange={setEnableBiometrics} />
              </View>
            ) : (
              <View style={[styles.noticeBox, { backgroundColor: colors.bgTertiary, borderRadius: radius.md }]}>
                <Text style={[styles.noticeText, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Biometric hardware not detected on this device. Master password will be used for unlocking.
                </Text>
              </View>
            )}

            <View style={styles.navRow}>
              <Button
                title="Back"
                variant="secondary"
                onPress={() => setStep(1)}
                iconLeft={<ArrowLeft size={16} color={colors.textPrimary} />}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Next: Emergency Key"
                variant="primary"
                onPress={handleStep2Next}
                iconRight={<ArrowRight size={16} color="#FFFFFF" />}
                style={{ flex: 2 }}
              />
            </View>
          </Card>
        )}

        {/* STEP 3: Emergency Recovery Cipher */}
        {step === 3 && (
          <Card variant="elevated" style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, fontSize: typography.lg }]}>
              The Ancient Recovery Cipher
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textTertiary, fontSize: typography.xs, marginBottom: spacing.sm }]}>
              Because AWarden has zero cloud recovery, this 25-character key is your ONLY safeguard if you forget your master password.
            </Text>

            <View
              style={[
                styles.warningBanner,
                { backgroundColor: colors.warningBg, borderColor: colors.warning, borderRadius: radius.md },
              ]}
            >
              <AlertTriangle size={16} color={colors.warning} style={{ marginRight: 8 }} />
              <Text style={[styles.warningText, { color: colors.warning, fontSize: typography.xs }]}>
                Save this key offline in a safe physical place. It cannot be recovered later without access!
              </Text>
            </View>

            {/* Cipher Code Parchment Box */}
            <Card variant="outlined" style={[styles.codeBox, { backgroundColor: colors.bgTertiary }]}>
              <Text
                style={[
                  styles.codeText,
                  { color: colors.textPrimary, fontSize: typography.base, fontFamily: 'monospace' },
                ]}
                selectable
              >
                {generatedRecoveryCode}
              </Text>
            </Card>

            <Button
              title={copiedCode ? 'Copied to Clipboard' : 'Copy Recovery Cipher'}
              iconLeft={copiedCode ? <Check size={16} color="#FFFFFF" /> : <Copy size={16} color="#FFFFFF" />}
              onPress={handleCopyRecoveryCode}
              variant={copiedCode ? 'secondary' : 'outline'}
              fullWidth
              style={{ marginBottom: spacing.md }}
            />

            {/* Confirmation Checkbox */}
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setConfirmedSaved(!confirmedSaved);
                if (error) setError('');
              }}
              style={[styles.checkboxRow, { minHeight: spacing.minTouchTarget }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: confirmedSaved }}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: confirmedSaved ? accent.primary : 'transparent',
                    borderColor: confirmedSaved ? accent.primary : colors.borderSubtle,
                    borderRadius: radius.xs,
                  },
                ]}
              >
                {confirmedSaved && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.textPrimary, fontSize: typography.xs }]}>
                I have securely saved this emergency cipher key in a private offline location.
              </Text>
            </TouchableOpacity>

            {error ? (
              <Text style={{ color: colors.danger, fontSize: typography.xs, marginVertical: 6 }}>
                {error}
              </Text>
            ) : null}

            <View style={styles.navRow}>
              <Button
                title="Back"
                variant="secondary"
                onPress={() => setStep(2)}
                iconLeft={<ArrowLeft size={16} color={colors.textPrimary} />}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Open AWarden Vault"
                variant="primary"
                onPress={handleCompleteSetup}
                loading={isLoading}
                iconRight={<Sparkles size={16} color="#FFFFFF" />}
                style={{ flex: 2 }}
              />
            </View>
          </Card>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted, fontSize: typography.xs }]}>
            AWarden • Local-First Personal OS & Vault
          </Text>
        </View>
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
  owlWrapper: {
    marginBottom: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    fontWeight: '600',
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  stepDot: {
    height: 8,
  },
  card: {
    padding: 22,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardSubtitle: {
    marginTop: 2,
    lineHeight: 16,
  },
  strengthBox: {
    marginBottom: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthLabel: {
    fontWeight: '600',
  },
  strengthScore: {
    fontWeight: '700',
  },
  strengthFeedback: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  trustBox: {
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustText: {
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 12,
  },
  switchTitle: {
    fontWeight: '600',
  },
  switchDesc: {
    marginTop: 2,
    lineHeight: 16,
  },
  noticeBox: {
    padding: 12,
    marginBottom: 16,
  },
  noticeText: {
    lineHeight: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  warningText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 16,
  },
  codeBox: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 8,
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
    lineHeight: 16,
    fontWeight: '500',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    textAlign: 'center',
  },
});

export default SetupScreen;
