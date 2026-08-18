/**
 * Life OS & Vault - System Settings Screen
 * Appearance customization, security controls, encrypted backups, CSV exports, activity trail, and danger zone
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Palette,
  Shield,
  Lock,
  Key,
  Fingerprint,
  Clock,
  Clipboard,
  Download,
  Upload,
  FileSpreadsheet,
  Activity,
  Trash2,
  Info,
  ChevronRight,
  Sun,
  Moon,
  Smartphone,
  Globe,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Card, SectionHeader, Switch, Button } from '../../components/ui';
import {
  AccentPicker,
  ChangeMasterPasswordModal,
  BackupModal,
  CsvExportModal,
  RecoveryCodeModal,
  ActivityLogModal,
  DangerZoneModal,
} from '../../components/settings';
import { dbService } from '../../services/db';
import { ThemeMode } from '../../theme/tokens';

export const SettingsScreen: React.FC = () => {
  const {
    mode,
    setMode,
    colors,
    accent,
    spacing,
    typography,
    radius,
  } = useTheme();

  const {
    biometricsAvailable,
    biometricsEnrolled,
    biometricsEnabled,
    setBiometricsSetting,
    autoLockTimeout,
    setAutoLockTimeoutSetting,
    lockNow,
  } = useAuth();

  // Settings State
  const [offlineIcons, setOfflineIcons] = useState(false);
  const [clipboardAutoClear, setClipboardAutoClear] = useState(true);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Modals
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);

  useEffect(() => {
    loadAppSettings();
  }, []);

  const loadAppSettings = async () => {
    try {
      const [offline, clip, lastBackup] = await Promise.all([
        dbService.getSetting('offline_icons'),
        dbService.getSetting('clipboard_autoclear'),
        dbService.getSetting('last_backup_timestamp'),
      ]);

      if (offline !== null) setOfflineIcons(offline === 'true');
      if (clip !== null) setClipboardAutoClear(clip === 'true');
      if (lastBackup !== null) {
        setLastBackupTime(new Date(parseInt(lastBackup, 10)).toLocaleDateString());
      }
    } catch (e) {
      console.warn('Failed to load app settings:', e);
    }
  };

  const handleToggleOfflineIcons = async (value: boolean) => {
    setOfflineIcons(value);
    await dbService.setSetting('offline_icons', value ? 'true' : 'false');
    Haptics.selectionAsync().catch(() => {});
  };

  const handleToggleClipboard = async (value: boolean) => {
    setClipboardAutoClear(value);
    await dbService.setSetting('clipboard_autoclear', value ? 'true' : 'false');
    Haptics.selectionAsync().catch(() => {});
  };

  const handleTimeoutChange = () => {
    Alert.alert('Auto-Lock Timeout', 'Choose when the vault locks after leaving the app:', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Immediately', onPress: () => setAutoLockTimeoutSetting(0) },
      { text: '1 Minute', onPress: () => setAutoLockTimeoutSetting(60) },
      { text: '5 Minutes (Default)', onPress: () => setAutoLockTimeoutSetting(300) },
      { text: '15 Minutes', onPress: () => setAutoLockTimeoutSetting(900) },
    ]);
  };

  const getTimeoutLabel = () => {
    switch (autoLockTimeout) {
      case 0:
        return 'Immediately';
      case 60:
        return '1 minute';
      case 300:
        return '5 minutes';
      case 900:
        return '15 minutes';
      default:
        return `${Math.floor(autoLockTimeout / 60)} minutes`;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { padding: spacing.lg, paddingBottom: 120 }]}>
        {/* ========================================== */}
        {/* 1. APPEARANCE SETTINGS */}
        {/* ========================================== */}
        <SectionHeader title="Appearance & Themes" style={{ marginTop: 0 }} />

        <Card variant="outlined" style={styles.cardSection}>
          {/* Theme Mode Segmented */}
          <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: typography.sm }]}>
            Theme Mode
          </Text>
          <View style={[styles.themeRow, { backgroundColor: colors.bgTertiary, borderRadius: radius.md }]}>
            {(['dark', 'light', 'system'] as ThemeMode[]).map((m) => {
              const isSelected = mode === m;
              const Icon = m === 'dark' ? Moon : m === 'light' ? Sun : Smartphone;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setMode(m);
                  }}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: isSelected ? accent.primary : 'transparent',
                      borderRadius: radius.sm,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                >
                  <Icon size={14} color={isSelected ? '#FFFFFF' : colors.textSecondary} />
                  <Text
                    style={[
                      styles.themeBtnText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary, fontSize: typography.xs },
                    ]}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Accent Color Picker */}
          <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: typography.sm, marginTop: spacing.md }]}>
            Accent Palette
          </Text>
          <AccentPicker />

          {/* Offline Favicons Switch */}
          <View style={[styles.switchRow, { borderTopColor: colors.borderSubtle, marginTop: spacing.md, paddingTop: spacing.md }]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Strict Offline Favicons
              </Text>
              <Text style={[styles.switchDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Block DuckDuckGo icon lookups to ensure zero external requests.
              </Text>
            </View>
            <Switch value={offlineIcons} onValueChange={handleToggleOfflineIcons} />
          </View>
        </Card>

        {/* ========================================== */}
        {/* 2. SECURITY CONTROLS */}
        {/* ========================================== */}
        <SectionHeader title="Security Controls" />

        <Card variant="outlined" style={styles.cardSection}>
          {/* Change Master Password */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsPasswordModalOpen(true);
            }}
            style={styles.settingLinkRow}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.xs }]}>
              <Lock size={16} color={accent.primary} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Change Master Password
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Re-encrypts all database records with new key
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Auto-Lock Timeout */}
          <TouchableOpacity
            onPress={handleTimeoutChange}
            style={[styles.settingLinkRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.xs }]}>
              <Clock size={16} color={accent.primary} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Auto-Lock Timeout
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Locks after {getTimeoutLabel()} in background
              </Text>
            </View>
            <Text style={[styles.valBadge, { color: accent.primary, fontSize: typography.xs }]}>
              {getTimeoutLabel()}
            </Text>
          </TouchableOpacity>

          {/* Biometrics Switch */}
          {biometricsAvailable && (
            <View style={[styles.switchRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
              <View style={styles.switchInfo}>
                <Text style={[styles.switchTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                  Biometric Authentication
                </Text>
                <Text style={[styles.switchDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                  Unlock vault using Face ID or Fingerprint
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={(val) => {
                  Haptics.selectionAsync().catch(() => {});
                  setBiometricsSetting(val);
                }}
              />
            </View>
          )}

          {/* Clipboard Auto-Clear */}
          <View style={[styles.switchRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Clipboard Auto-Clear
              </Text>
              <Text style={[styles.switchDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Wipes copied passwords from memory after 30 seconds
              </Text>
            </View>
            <Switch value={clipboardAutoClear} onValueChange={handleToggleClipboard} />
          </View>

          {/* Emergency Recovery Key */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsRecoveryModalOpen(true);
            }}
            style={[styles.settingLinkRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.xs }]}>
              <Key size={16} color={accent.primary} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Emergency Recovery Key
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                View or regenerate 8-word offline reset key
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* ========================================== */}
        {/* 3. DATA MANAGEMENT & BACKUPS */}
        {/* ========================================== */}
        <SectionHeader title="Data Management & Backups" />

        <Card variant="outlined" style={styles.cardSection}>
          {/* Encrypted Backup (.vault) */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsBackupModalOpen(true);
            }}
            style={styles.settingLinkRow}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.xs }]}>
              <Download size={16} color={accent.primary} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Encrypted Vault Backups (.vault)
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                {lastBackupTime ? `Last created ${lastBackupTime}` : 'Export or restore AES-256 backup file'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Export CSV Spreadsheets */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsCsvModalOpen(true);
            }}
            style={[styles.settingLinkRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1 }]}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.xs }]}>
              <FileSpreadsheet size={16} color={accent.primary} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Export CSV Spreadsheets
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Export Transactions & Notes for offline analysis
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* ========================================== */}
        {/* 4. ACTIVITY & AUDIT TRAIL */}
        {/* ========================================== */}
        <SectionHeader title="Privacy & Security Audit" />

        <Card variant="outlined" style={styles.cardSection}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsActivityModalOpen(true);
            }}
            style={styles.settingLinkRow}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.bgTertiary, borderRadius: radius.xs }]}>
              <Activity size={16} color={accent.primary} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.textPrimary, fontSize: typography.sm }]}>
                Security Activity Trail
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                View cryptographic & authentication audit logs
              </Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* ========================================== */}
        {/* 5. DANGER ZONE */}
        {/* ========================================== */}
        <SectionHeader title="Danger Zone" />

        <Card variant="outlined" style={[styles.cardSection, { borderColor: colors.dangerBg }]}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setIsDangerModalOpen(true);
            }}
            style={styles.settingLinkRow}
            accessibilityRole="button"
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.dangerBg, borderRadius: radius.xs }]}>
              <Trash2 size={16} color={colors.danger} />
            </View>
            <View style={styles.linkInfo}>
              <Text style={[styles.linkTitle, { color: colors.danger, fontSize: typography.sm }]}>
                Wipe Vault & Reset App
              </Text>
              <Text style={[styles.linkDesc, { color: colors.textTertiary, fontSize: typography.xs }]}>
                Permanently destroy all data and encryption keys
              </Text>
            </View>
            <ChevronRight size={18} color={colors.danger} />
          </TouchableOpacity>
        </Card>

        {/* ========================================== */}
        {/* 6. ABOUT & LOG OUT */}
        {/* ========================================== */}
        <SectionHeader title="About Life OS & Vault" />

        <Card variant="outlined" style={[styles.cardSection, { alignItems: 'center', padding: 20 }]}>
          <Text style={[styles.aboutTitle, { color: colors.textPrimary, fontSize: typography.base }]}>
            Life OS & Vault v1.0.0
          </Text>
          <Text style={[styles.aboutDesc, { color: colors.textSecondary, fontSize: typography.xs }]}>
            Local-First • Zero-Cloud • Hardware-Backed AES-256
          </Text>
          <Text style={[styles.aboutCopy, { color: colors.textMuted, fontSize: 10, marginTop: 6 }]}>
            No analytics, no cloud servers, 100% offline ownership.
          </Text>

          <Button
            title="Lock Vault Now"
            variant="outline"
            size="sm"
            iconLeft={<Lock size={14} color={accent.primary} />}
            onPress={() => lockNow()}
            style={{ marginTop: 16, width: '100%' }}
          />
        </Card>
      </ScrollView>

      {/* Modals */}
      <ChangeMasterPasswordModal
        visible={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <BackupModal
        visible={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={() => loadAppSettings()}
      />

      <CsvExportModal
        visible={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
      />

      <RecoveryCodeModal
        visible={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />

      <ActivityLogModal
        visible={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />

      <DangerZoneModal
        visible={isDangerModalOpen}
        onClose={() => setIsDangerModalOpen(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {},
  cardSection: {
    padding: 14,
  },
  settingLabel: {
    fontWeight: '700',
    marginBottom: 8,
  },
  themeRow: {
    flexDirection: 'row',
    padding: 3,
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  themeBtnText: {
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
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
  settingLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkInfo: {
    flex: 1,
  },
  linkTitle: {
    fontWeight: '600',
  },
  linkDesc: {
    marginTop: 1,
  },
  valBadge: {
    fontWeight: '700',
    marginRight: 4,
  },
  aboutTitle: {
    fontWeight: '800',
  },
  aboutDesc: {
    fontWeight: '600',
    marginTop: 2,
  },
  aboutCopy: {},
});

export default SettingsScreen;
