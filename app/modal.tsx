import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../src/theme/ThemeContext';
import { Card, Button } from '../src/components/ui';
import { useRouter } from 'expo-router';

export default function ModalScreen() {
  const { colors, accent, spacing, typography, radius } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary, padding: spacing.lg }]}>
      <Card variant="elevated" style={styles.card}>
        <View style={[styles.iconBox, { backgroundColor: accent.primaryBgLight, borderRadius: radius.xl }]}>
          <ShieldCheck size={36} color={accent.primary} />
        </View>

        <Text style={[styles.title, { color: colors.textPrimary, fontSize: typography.lg, marginTop: spacing.md }]}>
          Life OS & Vault
        </Text>

        <Text style={[styles.description, { color: colors.textTertiary, fontSize: typography.sm, marginVertical: spacing.sm }]}>
          Local-first, privacy-hardened personal operating system. Encrypted with PBKDF2 & AES-256 with hardware-backed keystore protection.
        </Text>

        <Button
          title="Done"
          variant="primary"
          fullWidth
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        />
      </Card>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    padding: 24,
  },
  iconBox: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
});
