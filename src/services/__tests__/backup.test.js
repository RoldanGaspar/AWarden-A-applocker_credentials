/**
 * Life OS & Vault - Backup & CSV Unit Tests
 */

const CryptoJS = require('crypto-js');

describe('Backup & CSV Logic Tests', () => {
  function deriveBackupKey(password, saltHex) {
    const salt = CryptoJS.enc.Hex.parse(saltHex);
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 5000, // lower iterations for fast unit test
      hasher: CryptoJS.algo.SHA256,
    });
  }

  function encryptBackupPayload(dataObj, password) {
    const saltHex = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
    const ivHex = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);

    const key = deriveBackupKey(password, saltHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const jsonStr = JSON.stringify(dataObj);
    const encrypted = CryptoJS.AES.encrypt(jsonStr, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return `${saltHex}:${ivHex}:${encrypted.toString()}`;
  }

  function decryptBackupPayload(payloadStr, password) {
    const parts = payloadStr.split(':');
    if (parts.length < 3) throw new Error('Invalid format');

    const [saltHex, ivHex, ciphertext] = parts;
    const key = deriveBackupKey(password, saltHex);
    const iv = CryptoJS.enc.Hex.parse(ivHex);

    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const decStr = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decStr) throw new Error('Decryption failed');

    return JSON.parse(decStr);
  }

  function formatCsv(rows) {
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    return rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
  }

  test('Backup encryption and decryption round-trip recovers identical JSON payload', () => {
    const mockEnvelope = {
      app: 'Life OS & Vault',
      version: 1,
      createdAt: '2026-08-17T00:00:00.000Z',
      data: {
        vault_items: [{ id: '1', title: 'GitHub' }],
        transactions: [{ id: 'tx1', amount: 5000, currency: 'PHP' }],
        notes: [{ id: 'n1', title: 'Architecture Plan' }],
        tasks: [{ id: 't1', title: 'Ship v1.0.0' }],
      },
    };

    const password = 'StrongBackupPassword#2026!';
    const encryptedVault = encryptBackupPayload(mockEnvelope, password);

    expect(typeof encryptedVault).toBe('string');
    expect(encryptedVault.split(':').length).toBe(3);

    const restored = decryptBackupPayload(encryptedVault, password);
    expect(restored.app).toBe('Life OS & Vault');
    expect(restored.version).toBe(1);
    expect(restored.data.vault_items[0].title).toBe('GitHub');
    expect(restored.data.transactions[0].amount).toBe(5000);
    expect(restored.data.notes[0].title).toBe('Architecture Plan');
    expect(restored.data.tasks[0].title).toBe('Ship v1.0.0');
  });

  test('Backup decryption fails with incorrect password', () => {
    const mockData = { app: 'Life OS & Vault', data: { test: true } };
    const encrypted = encryptBackupPayload(mockData, 'CorrectPassword123');

    expect(() => {
      decryptBackupPayload(encrypted, 'WrongPassword456');
    }).toThrow();
  });

  test('CSV formatting properly escapes quotes and commas', () => {
    const rows = [
      ['Date', 'Payee', 'Note', 'Amount'],
      ['2026-08-17', 'Coffee "Special" Shop, LLC', 'Breakfast & Latte', 250],
    ];

    const csvOutput = formatCsv(rows);
    expect(csvOutput).toContain('"Coffee ""Special"" Shop, LLC"');
    expect(csvOutput).toContain('"Breakfast & Latte"');
    expect(csvOutput).toContain('"250"');
  });
});
