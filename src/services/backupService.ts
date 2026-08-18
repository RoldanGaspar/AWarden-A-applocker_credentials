/**
 * Life OS & Vault - Backup & CSV Export Service
 * AES-256-CBC encrypted backups (.vault) with PBKDF2 key derivation and CSV exports via native Share Sheet
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { dbService } from './db';
import { CryptoService } from './cryptoService';

export interface BackupEnvelope {
  app: string;
  version: number;
  createdAt: string;
  data: any;
}

export class BackupService {
  /**
   * Derive a backup encryption key using PBKDF2-HMAC-SHA256 with 50,000 iterations
   */
  private static deriveBackupKey(password: string, saltHex: string): CryptoJS.lib.WordArray {
    const salt = CryptoJS.enc.Hex.parse(saltHex);
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 50000,
      hasher: CryptoJS.algo.SHA256,
    });
  }

  /**
   * Creates an encrypted .vault backup file and triggers native share sheet
   */
  static async createEncryptedBackup(backupPassword: string): Promise<string> {
    if (!backupPassword || backupPassword.length < 8) {
      throw new Error('Backup password must be at least 8 characters long');
    }

    // 1. Export database records
    const rawData = await dbService.exportDatabaseData();

    const envelope: BackupEnvelope = {
      app: 'Life OS & Vault',
      version: 1,
      createdAt: new Date().toISOString(),
      data: rawData,
    };

    const jsonString = JSON.stringify(envelope);

    // 2. Generate CSPRNG salt & IV
    const saltBytes = await Crypto.getRandomBytesAsync(16);
    const ivBytes = await Crypto.getRandomBytesAsync(16);

    const saltHex = Array.from(saltBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    const ivHex = Array.from(ivBytes).map((b) => b.toString(16).padStart(2, '0')).join('');

    const key = this.deriveBackupKey(backupPassword, saltHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    // 3. Encrypt payload with AES-256-CBC
    const encrypted = CryptoJS.AES.encrypt(jsonString, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    // Vault format: salt:iv:ciphertext
    const vaultPayload = `${saltHex}:${ivHex}:${encrypted.toString()}`;

    // 4. Save to cache file
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `LifeOS_Vault_Backup_${dateStr}_${Date.now().toString().slice(-4)}.vault`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, vaultPayload, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 5. Update last backup timestamp
    const now = Date.now().toString();
    await dbService.setSetting('last_backup_timestamp', now);
    await dbService.addAuditLog('ENCRYPTED_BACKUP_CREATED');

    // 6. Share if available
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Save Encrypted Life OS Vault Backup',
        UTI: 'public.data',
      });
    }

    return filePath;
  }

  /**
   * Restores an encrypted .vault backup file
   */
  static async restoreEncryptedBackup(fileUri: string, backupPassword: string): Promise<void> {
    if (!backupPassword) {
      throw new Error('Backup password is required');
    }

    // 1. Read file content
    const content = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const parts = content.split(':');
    if (parts.length < 3) {
      throw new Error('Invalid backup file format. Expected a .vault file.');
    }

    const [saltHex, ivHex, ciphertext] = parts;

    // 2. Derive key
    const key = this.deriveBackupKey(backupPassword, saltHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    // 3. Decrypt
    let decryptedStr = '';
    try {
      const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      throw new Error('Decryption failed. Incorrect backup password or corrupted file.');
    }

    if (!decryptedStr) {
      throw new Error('Decryption failed. Incorrect backup password.');
    }

    // 4. Parse & validate envelope
    let envelope: BackupEnvelope;
    try {
      envelope = JSON.parse(decryptedStr);
    } catch (e) {
      throw new Error('Failed to parse backup JSON structure.');
    }

    if (!envelope || envelope.app !== 'Life OS & Vault' || !envelope.data) {
      throw new Error('Incompatible backup file. Not a valid Life OS & Vault backup.');
    }

    // 5. Restore database
    await dbService.restoreDatabaseData(envelope.data);
    await dbService.addAuditLog('BACKUP_RESTORED');
  }

  /**
   * Export all Transactions to unencrypted CSV
   */
  static async exportTransactionsCsv(masterKey: string): Promise<string> {
    const transactions = await dbService.getTransactions(masterKey, { dateRange: 'all' });

    const escapeCsv = (str: string | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const header = 'Date,Type,Amount,Currency,Category,Payee/Source,Note,Recurring\n';
    const rows = transactions.map((t) => [
      escapeCsv(t.date),
      escapeCsv(t.type),
      t.amount,
      escapeCsv(t.currency),
      escapeCsv(t.categoryName || 'Uncategorized'),
      escapeCsv(t.payee_or_source),
      escapeCsv(t.note),
      t.is_recurring ? 'Yes' : 'No',
    ].join(',')).join('\n');

    const csvContent = header + rows;
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `LifeOS_Transactions_${dateStr}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Transactions CSV',
        UTI: 'public.comma-separated-values-text',
      });
    }

    await dbService.addAuditLog('TRANSACTIONS_CSV_EXPORTED');
    return filePath;
  }

  /**
   * Export all Notes to unencrypted CSV
   */
  static async exportNotesCsv(masterKey: string): Promise<string> {
    const notes = await dbService.getNotes(masterKey);

    const escapeCsv = (str: string | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const header = 'Title,Content,Tags,IsPinned,IsFavorite,Created,Updated\n';
    const rows = notes.map((n) => [
      escapeCsv(n.title),
      escapeCsv(n.content),
      escapeCsv((n.tags || []).join('; ')),
      n.is_pinned ? 'Yes' : 'No',
      n.is_favorite ? 'Yes' : 'No',
      escapeCsv(new Date(n.created_at).toISOString()),
      escapeCsv(new Date(n.updated_at).toISOString()),
    ].join(',')).join('\n');

    const csvContent = header + rows;
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `LifeOS_Notes_${dateStr}.csv`;
    const filePath = `${FileSystem.cacheDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Notes CSV',
        UTI: 'public.comma-separated-values-text',
      });
    }

    await dbService.addAuditLog('NOTES_CSV_EXPORTED');
    return filePath;
  }
}
