/**
 * Life OS & Vault - CSPRNG Password Generator Modal
 * Generates high-entropy passwords using expo-crypto random bytes
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  CheckSquare,
  Square,
} from 'lucide-react-native';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { Modal, Button, Card, ProgressBar } from '../ui';
import { CryptoService } from '../../services/cryptoService';

export interface PasswordGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPassword: (password: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  visible,
  onClose,
  onSelectPassword,
}) => {
  const { colors, accent, spacing, typography, radius } = useTheme();

  const [length, setLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generatePassword = useCallback(() => {
    let charPool = '';
    if (includeUpper) charPool += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (includeLower) charPool += 'abcdefghijkmnopqrstuvwxyz';
    if (includeNumbers) charPool += '23456789';
    if (includeSymbols) charPool += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charPool) {
      setGeneratedPassword('');
      return;
    }

    const randomBytes = Crypto.getRandomBytes(length);
    let pwd = '';
    for (let i = 0; i < length; i++) {
      pwd += charPool[randomBytes[i] % charPool.length];
    }

    setGeneratedPassword(pwd);
  }, [length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  useEffect(() => {
    if (visible) {
      generatePassword();
      setCopied(false);
    }
  }, [visible, generatePassword]);

  const handleCopy = async () => {
    if (!generatedPassword) return;
    await Clipboard.setStringAsync(generatedPassword);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopied(false), 3000);
  };

  const handleUse = () => {
    if (!generatedPassword) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onSelectPassword(generatedPassword);
    onClose();
  };

  const strength = CryptoService.evaluatePasswordStrength(generatedPassword);

  const lengthPresets = [12, 16, 20, 24, 32];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Password Generator"
      subtitle="CSPRNG cryptographically secure entropy"
      variant="bottomSheet"
    >
      <View style={styles.container}>
        {/* Password Output Box */}
        <Card
          variant="outlined"
          style={[styles.passwordCard, { backgroundColor: colors.bgSecondary, borderColor: accent.primary }]}
        >
          <Text
            style={[
              styles.passwordText,
              { color: colors.textPrimary, fontSize: typography.lg },
            ]}
            selectable
          >
            {generatedPassword || 'Select at least one character set'}
          </Text>

          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                generatePassword();
              }}
              style={[styles.actionIconBtn, { backgroundColor: colors.bgTertiary, borderRadius: radius.md }]}
              accessibilityRole="button"
              accessibilityLabel="Regenerate password"
            >
              <RefreshCw size={18} color={accent.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCopy}
              style={[
                styles.actionIconBtn,
                { backgroundColor: copied ? colors.successBg : colors.bgTertiary, borderRadius: radius.md },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Copy password to clipboard"
            >
              {copied ? (
                <Check size={18} color={colors.success} />
              ) : (
                <Copy size={18} color={colors.textPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </Card>

        {/* Strength Indicator */}
        <View style={styles.strengthRow}>
          <Text style={[styles.strengthLabel, { color: colors.textSecondary, fontSize: typography.xs }]}>
            Strength: <Text style={{ fontWeight: '700' }}>{strength.label}</Text>
          </Text>
          <Text style={[styles.strengthBits, { color: colors.textTertiary, fontSize: typography.xs }]}>
            {length} characters
          </Text>
        </View>
        <ProgressBar
          progress={strength.score / 4}
          status={strength.score <= 1 ? 'danger' : strength.score === 2 ? 'warning' : 'success'}
          height={6}
          style={{ marginBottom: spacing.lg }}
        />

        {/* Length Selector */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: typography.sm, marginBottom: 8 }]}>
          Password Length
        </Text>
        <View style={styles.presetRow}>
          {lengthPresets.map((len) => (
            <TouchableOpacity
              key={len}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setLength(len);
              }}
              style={[
                styles.lengthPill,
                {
                  backgroundColor: length === len ? accent.primary : colors.bgSecondary,
                  borderColor: length === len ? accent.primary : colors.borderSubtle,
                  borderRadius: radius.md,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Set length to ${len}`}
            >
              <Text
                style={[
                  styles.lengthPillText,
                  { color: length === len ? '#FFFFFF' : colors.textSecondary, fontSize: typography.sm },
                ]}
              >
                {len}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Character Set Options */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.textPrimary, fontSize: typography.sm, marginTop: spacing.md, marginBottom: 8 },
          ]}
        >
          Character Sets
        </Text>

        <View style={styles.optionsList}>
          {[
            { label: 'Uppercase Letters (A-Z)', value: includeUpper, toggle: () => setIncludeUpper(!includeUpper) },
            { label: 'Lowercase Letters (a-z)', value: includeLower, toggle: () => setIncludeLower(!includeLower) },
            { label: 'Numbers (0-9)', value: includeNumbers, toggle: () => setIncludeNumbers(!includeNumbers) },
            { label: 'Symbols (!@#$%^&*)', value: includeSymbols, toggle: () => setIncludeSymbols(!includeSymbols) },
          ].map((opt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                opt.toggle();
              }}
              style={[
                styles.optionRow,
                {
                  borderBottomColor: colors.borderSubtle,
                  borderBottomWidth: i < 3 ? 1 : 0,
                  minHeight: spacing.minTouchTarget,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: opt.value }}
              accessibilityLabel={opt.label}
            >
              <Text style={[styles.optionLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
                {opt.label}
              </Text>
              {opt.value ? (
                <CheckSquare size={20} color={accent.primary} />
              ) : (
                <Square size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <View style={[styles.buttonRow, { marginTop: spacing.lg }]}>
          <Button
            title="Cancel"
            variant="secondary"
            onPress={onClose}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Button
            title="Use Password"
            variant="primary"
            onPress={handleUse}
            iconLeft={<Sparkles size={18} color="#FFFFFF" />}
            style={{ flex: 2 }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  passwordCard: {
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  passwordText: {
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {},
  strengthBits: {},
  sectionTitle: {
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthPill: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lengthPillText: {
    fontWeight: '700',
  },
  optionsList: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  optionLabel: {
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
