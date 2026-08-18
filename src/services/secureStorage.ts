/**
 * Life OS & Vault - Secure Storage Service
 * Manages master key derivation materials, hashes, and security flags via expo-secure-store
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_KEYS = {
  MASTER_PASSWORD_HASH: 'applocker_master_hash',
  MASTER_PASSWORD_SALT: 'applocker_master_salt',
  RECOVERY_CODE_HASH: 'applocker_recovery_hash',
  BIOMETRICS_ENABLED: 'applocker_biometrics_enabled',
  AUTO_LOCK_TIMEOUT: 'applocker_autolock_timeout',
  BIOMETRIC_VAULT_KEY: 'applocker_biometric_vault_key',
  CLIPBOARD_CLEAR_TIMEOUT: 'applocker_clipboard_timeout',
};

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export class SecureStorageService {
  /**
   * Safe set item handling platform capabilities
   */
  private static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value, SECURE_STORE_OPTIONS);
      }
    } catch (e) {
      console.warn(`SecureStore write failed for key ${key}, using fallback:`, e);
      await AsyncStorage.setItem(key, value);
    }
  }

  /**
   * Safe get item handling platform capabilities
   */
  private static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      const val = await SecureStore.getItemAsync(key, SECURE_STORE_OPTIONS);
      if (val !== null) return val;
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`SecureStore read failed for key ${key}, using fallback:`, e);
      return await AsyncStorage.getItem(key);
    }
  }

  /**
   * Safe delete item
   */
  private static async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(key, SECURE_STORE_OPTIONS);
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to delete key ${key}:`, e);
    }
  }

  // Master Password Auth
  static async saveMasterPasswordAuth(hash: string, salt: string): Promise<void> {
    await this.setItem(SECURE_KEYS.MASTER_PASSWORD_HASH, hash);
    await this.setItem(SECURE_KEYS.MASTER_PASSWORD_SALT, salt);
  }

  static async getMasterPasswordAuth(): Promise<{ hash: string | null; salt: string | null }> {
    const [hash, salt] = await Promise.all([
      this.getItem(SECURE_KEYS.MASTER_PASSWORD_HASH),
      this.getItem(SECURE_KEYS.MASTER_PASSWORD_SALT),
    ]);
    return { hash, salt };
  }

  static async hasMasterPassword(): Promise<boolean> {
    const hash = await this.getItem(SECURE_KEYS.MASTER_PASSWORD_HASH);
    return !!hash;
  }

  // Recovery Code Hash
  static async saveRecoveryCodeHash(hash: string): Promise<void> {
    await this.setItem(SECURE_KEYS.RECOVERY_CODE_HASH, hash);
  }

  static async getRecoveryCodeHash(): Promise<string | null> {
    return await this.getItem(SECURE_KEYS.RECOVERY_CODE_HASH);
  }

  // Biometrics
  static async setBiometricsEnabled(enabled: boolean): Promise<void> {
    await this.setItem(SECURE_KEYS.BIOMETRICS_ENABLED, enabled ? 'true' : 'false');
  }

  static async isBiometricsEnabled(): Promise<boolean> {
    const val = await this.getItem(SECURE_KEYS.BIOMETRICS_ENABLED);
    return val === 'true';
  }

  // Biometric Vault Key (Released only upon successful local biometric authentication)
  static async saveBiometricVaultKey(masterKeyHex: string): Promise<void> {
    await this.setItem(SECURE_KEYS.BIOMETRIC_VAULT_KEY, masterKeyHex);
  }

  static async getBiometricVaultKey(): Promise<string | null> {
    return await this.getItem(SECURE_KEYS.BIOMETRIC_VAULT_KEY);
  }

  static async clearBiometricVaultKey(): Promise<void> {
    await this.deleteItem(SECURE_KEYS.BIOMETRIC_VAULT_KEY);
  }

  // Auto Lock Timeout (seconds, default 300)
  static async setAutoLockTimeout(seconds: number): Promise<void> {
    await this.setItem(SECURE_KEYS.AUTO_LOCK_TIMEOUT, seconds.toString());
  }

  static async getAutoLockTimeout(): Promise<number> {
    const val = await this.getItem(SECURE_KEYS.AUTO_LOCK_TIMEOUT);
    if (!val) return 300; // default 5 minutes
    const num = parseInt(val, 10);
    return isNaN(num) ? 300 : num;
  }

  // Wipe All Vault Credentials and Security Material
  static async wipeAllSecurityData(): Promise<void> {
    await Promise.all([
      this.deleteItem(SECURE_KEYS.MASTER_PASSWORD_HASH),
      this.deleteItem(SECURE_KEYS.MASTER_PASSWORD_SALT),
      this.deleteItem(SECURE_KEYS.RECOVERY_CODE_HASH),
      this.deleteItem(SECURE_KEYS.BIOMETRICS_ENABLED),
      this.deleteItem(SECURE_KEYS.BIOMETRIC_VAULT_KEY),
      this.deleteItem(SECURE_KEYS.AUTO_LOCK_TIMEOUT),
      this.deleteItem(SECURE_KEYS.CLIPBOARD_CLEAR_TIMEOUT),
    ]);
  }
}
