/**
 * Life OS & Vault - Lock Screen UI
 * Local-First, Zero-Cloud Master Password & Biometric Unlock Screen
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
import { ShieldCheck, Fingerprint, Lock, ShieldAlert, KeyRound } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Input, Card } from '../../components/ui';

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

  // Trigger biometrics on mount if enabled
  useEffect(() => {
    if (biometricsEnabled && biometricsAvailable) {
      unlockWithBiometrics().catch(() => {});
    }
  }, [biometricsEnabled, biometricsAvailable]);

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
            <ShieldCheck size={42} color={accent.primary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.xxl }]}>
            Life OS & Vault
          </Text>
          <Text style={[styles.subtitle, { color: colors.textTertiary, fontSize: typography.sm }]}>
            Local-First • Zero-Cloud • AES-256
          </Text>
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
            isPassword
            leftIcon={<Lock size={18} color={colors.textSecondary} />}
            errorText={error}
            onSubmitEditing={handlePasswordUnlock}
            returnKeyType="go"
          />

          {failedAttempts > 2 && (
            <View style={[styles.warningRow, { backgroundColor: colors.warningBg }]}>
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
              Forgot password? Use Recovery Code
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Trust & Security Signals */}
        <View style={styles.trustBadges}>
          <View style={[styles.badge, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
            <Text style={[styles.badgeText, { color: colors.textTertiary, fontSize: typography.xs }]}>
              🔒 Hardware Keystore Protected
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
            <Text style={[styles.badgeText, { color: colors.textTertiary, fontSize: typography.xs }]}>
              🛡️ Zero Telemetry
            </Text>
          </View>
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
    marginBottom: 24,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: 16,
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
    maxWidth: 440,
    alignSelf: 'center',
  },
  cardTitle: {
    fontWeight: '700',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  warningText: {
    fontWeight: '500',
  },
  recoveryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  recoveryText: {
    fontWeight: '500',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 28,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontWeight: '500',
  },
});
