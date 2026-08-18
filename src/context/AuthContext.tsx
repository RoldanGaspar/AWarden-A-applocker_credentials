/**
 * Life OS & Vault - Authentication & Security Context
 * Zero-cloud security gate, master key derivation, biometric unlock, auto-lock timer, and security audit logging
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { CryptoService } from '../services/cryptoService';
import { SecureStorageService } from '../services/secureStorage';
import { dbService, logAuditEvent } from '../services/db';

interface AuthContextType {
  isReady: boolean;
  isInitialized: boolean;
  isLocked: boolean;
  masterKey: string | null;
  biometricsAvailable: boolean;
  biometricsEnrolled: boolean;
  biometricsEnabled: boolean;
  autoLockTimeout: number;
  failedAttempts: number;
  setupMasterPassword: (
    password: string,
    enableBiometrics: boolean
  ) => Promise<{ recoveryCode: string }>;
  unlockWithPassword: (password: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithRecoveryCode: (
    code: string,
    newPassword: string,
    enableBiometrics: boolean
  ) => Promise<{ newRecoveryCode: string }>;
  lockNow: (isAutoLock?: boolean) => void;
  setAutoLockTimeoutSetting: (seconds: number) => Promise<void>;
  setBiometricsSetting: (enabled: boolean) => Promise<void>;
  changeMasterPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ newRecoveryCode: string }>;
  regenerateRecoveryCode: (password: string) => Promise<{ newRecoveryCode: string }>;
  wipeVault: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [masterKey, setMasterKey] = useState<string | null>(null);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnrolled, setBiometricsEnrolled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [autoLockTimeout, setAutoLockTimeout] = useState<number>(300); // 5 minutes default
  const [failedAttempts, setFailedAttempts] = useState(0);

  const backgroundTimeRef = useRef<number | null>(null);
  const autoLockTimeoutRef = useRef<number>(300);

  // Keep ref synced with state for background AppState listener
  useEffect(() => {
    autoLockTimeoutRef.current = autoLockTimeout;
  }, [autoLockTimeout]);

  // Initial Auth & Hardware Verification
  useEffect(() => {
    const initAuth = async () => {
      try {
        await dbService.init();

        const [hasPassword, bioEnabled, savedTimeout, hasHardware, isEnrolled] =
          await Promise.all([
            SecureStorageService.hasMasterPassword(),
            SecureStorageService.isBiometricsEnabled(),
            SecureStorageService.getAutoLockTimeout(),
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
          ]);

        setIsInitialized(hasPassword);
        setIsLocked(hasPassword); // if initialized, locked by default on launch
        setBiometricsEnabled(bioEnabled);
        setAutoLockTimeout(savedTimeout);
        setBiometricsAvailable(hasHardware);
        setBiometricsEnrolled(isEnrolled);
      } catch (error) {
        console.error('Error during AuthContext initialization:', error);
      } finally {
        setIsReady(true);
      }
    };

    initAuth();
  }, []);

  // Auto-Lock AppState Listener
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        backgroundTimeRef.current = Date.now();
      } else if (nextAppState === 'active') {
        if (backgroundTimeRef.current && isInitialized && masterKey) {
          const elapsedSeconds = (Date.now() - backgroundTimeRef.current) / 1000;
          const currentTimeout = autoLockTimeoutRef.current;

          if (currentTimeout === 0 || elapsedSeconds >= currentTimeout) {
            lockNow(true);
          }
        }
        backgroundTimeRef.current = null;
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isInitialized, masterKey]);

  // Setup Master Password (First launch)
  const setupMasterPassword = async (
    password: string,
    enableBiometrics: boolean
  ): Promise<{ recoveryCode: string }> => {
    const salt = await CryptoService.generateSalt();
    const derivedKey = CryptoService.deriveMasterKey(password, salt);
    const passwordHash = CryptoService.hashDerivedKey(derivedKey);

    const recoveryCode = CryptoService.generateRecoveryCode();
    const recoveryHash = CryptoService.hashRecoveryCode(recoveryCode);

    await SecureStorageService.saveMasterPasswordAuth(passwordHash, salt);
    await SecureStorageService.saveRecoveryCodeHash(recoveryHash);
    await SecureStorageService.setBiometricsEnabled(enableBiometrics);

    // Save key in secure hardware keystore only if user opted into biometrics
    if (enableBiometrics) {
      await SecureStorageService.saveBiometricVaultKey(derivedKey);
    } else {
      await SecureStorageService.clearBiometricVaultKey();
    }

    setMasterKey(derivedKey);
    setIsInitialized(true);
    setIsLocked(false);
    setBiometricsEnabled(enableBiometrics);
    setFailedAttempts(0);

    await logAuditEvent('MASTER_PASSWORD_SETUP');

    return { recoveryCode };
  };

  // Unlock with Password
  const unlockWithPassword = async (password: string): Promise<boolean> => {
    try {
      const { hash, salt } = await SecureStorageService.getMasterPasswordAuth();
      if (!hash || !salt) {
        throw new Error('Master password not configured');
      }

      const derivedKey = CryptoService.deriveMasterKey(password, salt);
      if (!CryptoService.verifyMasterKey(derivedKey, hash)) {
        setFailedAttempts((prev) => prev + 1);
        await logAuditEvent('AUTH_UNLOCK_PASSWORD_FAILED');
        return false;
      }

      // Refresh hardware biometric storage if biometrics is active
      if (biometricsEnabled) {
        await SecureStorageService.saveBiometricVaultKey(derivedKey);
      }

      setMasterKey(derivedKey);
      setIsLocked(false);
      setFailedAttempts(0);

      await logAuditEvent('AUTH_UNLOCK_PASSWORD_SUCCESS');
      return true;
    } catch (error) {
      console.error('Failed to unlock with password:', error);
      await logAuditEvent('AUTH_UNLOCK_PASSWORD_ERROR');
      return false;
    }
  };

  // Unlock with Biometrics
  const unlockWithBiometrics = async (): Promise<boolean> => {
    try {
      if (!biometricsEnabled || !biometricsAvailable || !biometricsEnrolled) {
        return false;
      }

      // Prompt OS Biometric Dialog (Face ID / Touch ID / Fingerprint)
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Life OS Vault',
        fallbackLabel: 'Use Master Password',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        // Retrieve master key released from hardware keystore
        const storedKey = await SecureStorageService.getBiometricVaultKey();
        if (storedKey) {
          setMasterKey(storedKey);
          setIsLocked(false);
          setFailedAttempts(0);
          await logAuditEvent('AUTH_UNLOCK_BIOMETRICS_SUCCESS');
          return true;
        }
      }

      await logAuditEvent('AUTH_UNLOCK_BIOMETRICS_FAILED');
      return false;
    } catch (error) {
      console.error('Biometric authentication error:', error);
      await logAuditEvent('AUTH_UNLOCK_BIOMETRICS_ERROR');
      return false;
    }
  };

  // Unlock & Reset via Recovery Code
  const unlockWithRecoveryCode = async (
    code: string,
    newPassword: string,
    enableBiometrics: boolean
  ): Promise<{ newRecoveryCode: string }> => {
    const storedHash = await SecureStorageService.getRecoveryCodeHash();
    if (!storedHash) {
      throw new Error('No recovery code found in secure storage');
    }

    const isValid = CryptoService.verifyRecoveryCode(code, storedHash);
    if (!isValid) {
      setFailedAttempts((prev) => prev + 1);
      await logAuditEvent('AUTH_RECOVERY_CODE_FAILED');
      throw new Error('Invalid recovery code');
    }

    // Generate new salt, derived key, password hash, and new recovery code
    const salt = await CryptoService.generateSalt();
    const derivedKey = CryptoService.deriveMasterKey(newPassword, salt);
    const passwordHash = CryptoService.hashDerivedKey(derivedKey);

    const newRecoveryCode = CryptoService.generateRecoveryCode();
    const newRecoveryHash = CryptoService.hashRecoveryCode(newRecoveryCode);

    await SecureStorageService.saveMasterPasswordAuth(passwordHash, salt);
    await SecureStorageService.saveRecoveryCodeHash(newRecoveryHash);
    await SecureStorageService.setBiometricsEnabled(enableBiometrics);

    if (enableBiometrics) {
      await SecureStorageService.saveBiometricVaultKey(derivedKey);
    } else {
      await SecureStorageService.clearBiometricVaultKey();
    }

    setMasterKey(derivedKey);
    setIsLocked(false);
    setBiometricsEnabled(enableBiometrics);
    setFailedAttempts(0);

    await logAuditEvent('AUTH_RECOVERY_RESET_SUCCESS');

    return { newRecoveryCode };
  };

  // Lock Now (Manual or Auto-Lock)
  const lockNow = (isAutoLock = false) => {
    setMasterKey(null);
    setIsLocked(true);
    logAuditEvent(isAutoLock ? 'AUTH_AUTO_LOCK' : 'AUTH_MANUAL_LOCK').catch(() => {});
  };

  // Settings helpers
  const setAutoLockTimeoutSetting = async (seconds: number) => {
    setAutoLockTimeout(seconds);
    await SecureStorageService.setAutoLockTimeout(seconds);
    await logAuditEvent('SETTINGS_AUTOLOCK_CHANGED', 'timeout', seconds.toString());
  };

  const setBiometricsSetting = async (enabled: boolean) => {
    setBiometricsEnabled(enabled);
    await SecureStorageService.setBiometricsEnabled(enabled);
    if (!enabled) {
      await SecureStorageService.clearBiometricVaultKey();
    } else if (masterKey) {
      await SecureStorageService.saveBiometricVaultKey(masterKey);
    }
    await logAuditEvent('SETTINGS_BIOMETRICS_CHANGED', 'enabled', enabled ? 'true' : 'false');
  };

  // Change Master Password (Re-encrypts all database items)
  const changeMasterPassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ newRecoveryCode: string }> => {
    const { hash, salt } = await SecureStorageService.getMasterPasswordAuth();
    if (!hash || !salt) {
      throw new Error('Master password not configured');
    }

    const oldMasterKey = CryptoService.deriveMasterKey(currentPassword, salt);
    if (!CryptoService.verifyMasterKey(oldMasterKey, hash)) {
      throw new Error('Current master password is incorrect');
    }

    // Generate new credentials
    const newSalt = await CryptoService.generateSalt();
    const newDerivedKey = CryptoService.deriveMasterKey(newPassword, newSalt);
    const newPasswordHash = CryptoService.hashDerivedKey(newDerivedKey);

    const newRecoveryCode = CryptoService.generateRecoveryCode();
    const newRecoveryHash = CryptoService.hashRecoveryCode(newRecoveryCode);

    // Re-encrypt all items in database
    await dbService.reEncryptEntireDatabase(oldMasterKey, newDerivedKey);

    // Save new security keys
    await SecureStorageService.saveMasterPasswordAuth(newPasswordHash, newSalt);
    await SecureStorageService.saveRecoveryCodeHash(newRecoveryHash);

    if (biometricsEnabled) {
      await SecureStorageService.saveBiometricVaultKey(newDerivedKey);
    }

    setMasterKey(newDerivedKey);
    await logAuditEvent('MASTER_PASSWORD_CHANGED');

    return { newRecoveryCode };
  };

  // Regenerate Recovery Code
  const regenerateRecoveryCode = async (
    password: string
  ): Promise<{ newRecoveryCode: string }> => {
    const { hash, salt } = await SecureStorageService.getMasterPasswordAuth();
    if (!hash || !salt) {
      throw new Error('Master password not configured');
    }

    const derivedKey = CryptoService.deriveMasterKey(password, salt);
    if (!CryptoService.verifyMasterKey(derivedKey, hash)) {
      throw new Error('Master password is incorrect');
    }

    const newRecoveryCode = CryptoService.generateRecoveryCode();
    const newRecoveryHash = CryptoService.hashRecoveryCode(newRecoveryCode);

    await SecureStorageService.saveRecoveryCodeHash(newRecoveryHash);
    await logAuditEvent('RECOVERY_CODE_REGENERATED');

    return { newRecoveryCode };
  };

  const wipeVault = async () => {
    await SecureStorageService.wipeAllSecurityData();
    await dbService.wipeDatabase();
    setMasterKey(null);
    setIsInitialized(false);
    setIsLocked(true);
    await logAuditEvent('VAULT_WIPED_CLEAN');
  };

  const contextValue = useMemo(
    () => ({
      isReady,
      isInitialized,
      isLocked,
      masterKey,
      biometricsAvailable,
      biometricsEnrolled,
      biometricsEnabled,
      autoLockTimeout,
      failedAttempts,
      setupMasterPassword,
      unlockWithPassword,
      unlockWithBiometrics,
      unlockWithRecoveryCode,
      lockNow,
      setAutoLockTimeoutSetting,
      setBiometricsSetting,
      changeMasterPassword,
      regenerateRecoveryCode,
      wipeVault,
    }),
    [
      isReady,
      isInitialized,
      isLocked,
      masterKey,
      biometricsAvailable,
      biometricsEnrolled,
      biometricsEnabled,
      autoLockTimeout,
      failedAttempts,
    ]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
