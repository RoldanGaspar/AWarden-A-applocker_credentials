/**
 * Life OS Cryptographic & Security Verification Tests
 * Unit tests for PBKDF2 derivation, AES-256-CBC, and Recovery Code Hashing
 */

const CryptoJS = require('crypto-js');

describe('Cryptographic Engine Verification', () => {
  const testPassword = 'CorrectHorseBatteryStaple99!';
  const testSalt = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

  test('PBKDF2 Master Key Derivation produces 256-bit hex key with 150k iterations', () => {
    const salt = CryptoJS.enc.Hex.parse(testSalt);
    const derivedKey = CryptoJS.PBKDF2(testPassword, salt, {
      keySize: 256 / 32,
      iterations: 150000,
      hasher: CryptoJS.algo.SHA256,
    }).toString(CryptoJS.enc.Hex);

    expect(derivedKey).toBeDefined();
    expect(derivedKey.length).toBe(64); // 256 bits = 64 hex characters
  });

  test('AES-256-CBC encryption and decryption preserves data integrity', () => {
    const salt = CryptoJS.enc.Hex.parse(testSalt);
    const keyHex = CryptoJS.PBKDF2(testPassword, salt, {
      keySize: 256 / 32,
      iterations: 150000,
      hasher: CryptoJS.algo.SHA256,
    }).toString(CryptoJS.enc.Hex);

    const secretPayload = 'SuperSecretVaultCredential_P@$$w0rd_12345';
    const key = CryptoJS.enc.Hex.parse(keyHex);
    const iv = CryptoJS.lib.WordArray.random(16);

    const encrypted = CryptoJS.AES.encrypt(secretPayload, key, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const ivHex = iv.toString(CryptoJS.enc.Hex);
    const ciphertextBase64 = encrypted.toString();
    const serialized = `${ivHex}:${ciphertextBase64}`;

    // Decrypt
    const [parsedIvHex, parsedCt] = serialized.split(':');
    const decryptIv = CryptoJS.enc.Hex.parse(parsedIvHex);
    const decrypted = CryptoJS.AES.decrypt(parsedCt, key, {
      iv: decryptIv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);

    expect(decryptedText).toBe(secretPayload);
  });

  test('Recovery Code Hashing produces deterministic SHA-256 hash', () => {
    const recoveryCode = 'VAULT-K8R2P-9M4LQ-7X3TZ-5W1BY-8NC6D';
    const normalized = recoveryCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const recoveryHash1 = CryptoJS.SHA256(`recovery_${normalized}`).toString(CryptoJS.enc.Hex);
    const recoveryHash2 = CryptoJS.SHA256(`recovery_${normalized}`).toString(CryptoJS.enc.Hex);

    expect(recoveryHash1).toBe(recoveryHash2);
    expect(recoveryHash1.length).toBe(64);
  });
});
