/**
 * Life OS & Vault - Security Gate Component
 * Controls access between Locked/Setup/Recovery states and the Authenticated Main App
 */

import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { LockScreen } from '../screens/auth/LockScreen';
import { SetupScreen } from '../screens/auth/SetupScreen';
import { RecoveryScreen } from '../screens/auth/RecoveryScreen';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady, isInitialized, isLocked } = useAuth();
  const { colors, accent, typography } = useTheme();
  const [inRecoveryMode, setInRecoveryMode] = useState(false);

  // Loading state while verifying secure storage & hardware
  if (!isReady) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bgPrimary }]}>
        <ShieldCheck size={54} color={accent.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: colors.textSecondary, fontSize: typography.base },
          ]}
        >
          Initializing Secure Vault...
        </Text>
        <ActivityIndicator size="large" color={accent.primary} style={{ marginTop: 16 }} />
      </View>
    );
  }

  // First launch onboarding (no master password setup yet)
  if (!isInitialized) {
    return <SetupScreen />;
  }

  // Emergency Recovery flow
  if (isLocked && inRecoveryMode) {
    return <RecoveryScreen onBackToLock={() => setInRecoveryMode(false)} />;
  }

  // Locked state
  if (isLocked) {
    return <LockScreen onGoToRecovery={() => setInRecoveryMode(true)} />;
  }

  // Authenticated & Unlocked
  return <>{children}</>;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontWeight: '600',
  },
});
