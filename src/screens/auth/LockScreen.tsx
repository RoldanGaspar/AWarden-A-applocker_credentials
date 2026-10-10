/**
 * AWarden - Security Gate Lock Screen UI
 * Local-First, Zero-Cloud Master Password & Biometric Unlock Screen with Interactive Owl Guardian Mascot
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Fingerprint, Lock, ShieldAlert, KeyRound, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Input, Card, AWardenMark, OwlMood, AnimatedPatternBackground } from '../../components/ui';

export interface LockScreenProps {
  onGoToRecovery: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onGoToRecovery }) => {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const {
    unlockWithPassword,
    unlockWithBiometrics,
    biometricsEnabled,
    biometricsAvailable,
    failedAttempts,
  } = useAuth();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Trigger biometrics on mount if enabled
  useEffect(() => {
    if (biometricsEnabled && biometricsAvailable) {
      unlockWithBiometrics().catch(() => {});
    }
  }, [biometricsEnabled, biometricsAvailable]);

  // Determine dynamic owl mascot mood
  const getOwlMood = (): OwlMood => {
    if (isSuccess || isLoading) return 'happy';
    if (error) return 'alert';
    if (isPasswordVisible && isInputFocused) return 'peeking';
    if (isInputFocused || password.length > 0) return 'eyes_closed';
    return 'awake';
  };

  const handlePasswordUnlock = async () => {
    if (!password.trim()) {
      setError('Please enter your master password');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await unlockWithPassword(password);
      if (!success) {
        setError('Incorrect master password');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      } else {
        setIsSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (e: any) {
      setError(e?.message || 'Authentication failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricPress = async () => {
    setError('');
    const success = await unlockWithBiometrics();
    if (!success) {
      setError('Biometric authentication failed or canceled');
    } else {
      setIsSuccess(true);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.bgPrimary }]}
    >
      <AnimatedPatternBackground />
      <ScrollView
        style={styles.contentLayer}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header AWarden Branding */}
        <View style={styles.header}>
          <View style={styles.owlWrapper}>
            <AWardenMark size={120} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.xxl }]}>
            AWarden Vault
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary, fontSize: typography.sm }]}>
            The Vigilant Guardian of Your Digital Life
          </Text>

          {/* Micro-Interaction Status Pill */}
          <View style={[styles.statusPill, { backgroundColor: colors.bgSecondary, borderColor: colors.borderSubtle }]}>
            <Sparkles size={13} color={accent.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.statusText, { color: colors.textSecondary, fontSize: typography.xs }]}>
              {getOwlMood() === 'eyes_closed'
                ? "AWarden is looking away — your secret is safe."
                : getOwlMood() === 'peeking'
                ? "AWarden is peeking at revealed text."
                : getOwlMood() === 'alert'
                ? "Vigilance alert: verification failed."
                : "Guardian on duty • Zero-Cloud Encrypted"}
            </Text>
          </View>
        </View>

        {/* Unlock Card */}
        <Card variant="elevated" style={styles.card}>
          <Text
            style={[
              styles.cardTitle,
              { color: colors.textPrimary, fontSize: typography.lg, marginBottom: spacing.md },
            ]}
          >
            Unlock Your Vault
          </Text>

          <Input
            label="Master Password"
            placeholder="Enter master password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError('');
            }}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            onTogglePasswordVisibility={(visible) => setIsPasswordVisible(visible)}
            isPassword
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            errorText={error}
            onSubmitEditing={handlePasswordUnlock}
            returnKeyType="go"
          />

          {failedAttempts > 2 && (
            <View style={[styles.warningRow, { backgroundColor: colors.warningBg, borderRadius: radius.sm }]}>
              <ShieldAlert size={16} color={colors.warning} />
              <Text
                style={[
                  styles.warningText,
                  { color: colors.warning, fontSize: typography.xs, marginLeft: spacing.xs },
                ]}
              >
                {failedAttempts} consecutive failed attempts.
              </Text>
            </View>
          )}

          <Button
            title="Unlock Vault"
            onPress={handlePasswordUnlock}
            loading={isLoading}
            variant="primary"
            fullWidth
            style={{ marginTop: spacing.xs }}
          />

          {biometricsEnabled && biometricsAvailable && (
            <Button
              title="Unlock with Biometrics"
              onPress={handleBiometricPress}
              variant="outline"
              iconLeft={<Fingerprint size={20} color={accent.primary} />}
              fullWidth
              style={{ marginTop: spacing.md }}
            />
          )}

          {/* Recovery Code Option */}
          <TouchableOpacity
            onPress={onGoToRecovery}
            style={[styles.recoveryLink, { minHeight: spacing.minTouchTarget }]}
            accessibilityRole="button"
            accessibilityLabel="Forgot master password? Use emergency recovery code"
          >
            <KeyRound size={16} color={colors.textTertiary} style={{ marginRight: 6 }} />
            <Text
              style={[
                styles.recoveryText,
                { color: colors.textSecondary, fontSize: typography.sm },
              ]}
            >
              Forgot password? Use recovery code
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Security badge footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted, fontSize: typography.xs }]}>
            Protected by PBKDF2-HMAC-SHA256 & AES-256-CBC
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
  contentLayer: {
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  owlWrapper: {
    marginBottom: 12,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
  },
  statusText: {
    fontWeight: '600',
  },
  card: {
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontWeight: '600',
    flex: 1,
  },
  recoveryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 4,
  },
  recoveryText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    opacity: 0.8,
  },
});

export default LockScreen;
