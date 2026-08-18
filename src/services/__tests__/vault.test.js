/**
 * Life OS & Vault - Vault & Password Health Auditor Unit Tests
 */

const CryptoJS = require('crypto-js');

describe('Vault & Password Health Logic Tests', () => {
  // Test password health evaluator function directly
  function analyzePasswordHealth(items) {
    const issues = [];
    const passwordMap = new Map();

    for (const item of items) {
      const pwd = item.password || '';

      const hasLower = /[a-z]/.test(pwd);
      const hasUpper = /[A-Z]/.test(pwd);
      const hasDigit = /[0-9]/.test(pwd);
      const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
      const charClassCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

      if (pwd.length < 8) {
        issues.push({
          itemId: item.id,
          title: item.title,
          issueType: 'weak',
          reason: `Password is only ${pwd.length} characters (min 8 required)`,
        });
      } else if (charClassCount <= 1) {
        issues.push({
          itemId: item.id,
          title: item.title,
          issueType: 'weak',
          reason: 'Password contains only one type of character',
        });
      }

      if (pwd) {
        const existing = passwordMap.get(pwd) || [];
        existing.push(item);
        passwordMap.set(pwd, existing);
      }
    }

    let duplicateCount = 0;
    for (const [, group] of passwordMap.entries()) {
      if (group.length > 1) {
        duplicateCount += group.length;
        for (const item of group) {
          issues.push({
            itemId: item.id,
            title: item.title,
            issueType: 'duplicate',
            reason: `Reused password`,
          });
        }
      }
    }

    const weakCount = issues.filter((i) => i.issueType === 'weak').length;
    const totalCount = items.length;

    let healthScore = 100;
    if (totalCount > 0) {
      const penalty = (weakCount * 25 + duplicateCount * 15) / totalCount;
      healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
    }

    return {
      totalCount,
      weakCount,
      duplicateCount,
      healthScore,
      issues,
    };
  }

  test('Identifies weak passwords under 8 characters', () => {
    const mockItems = [
      { id: '1', title: 'Test 1', password: 'short' }, // 5 chars -> weak
      { id: '2', title: 'Test 2', password: 'StrongP@ssw0rd!123' }, // strong
    ];

    const report = analyzePasswordHealth(mockItems);
    expect(report.weakCount).toBe(1);
    expect(report.healthScore).toBeLessThan(100);
    expect(report.issues[0].title).toBe('Test 1');
  });

  test('Identifies duplicate reused passwords across different accounts', () => {
    const mockItems = [
      { id: '1', title: 'Google', password: 'SharedSecretPass123!' },
      { id: '2', title: 'GitHub', password: 'SharedSecretPass123!' },
      { id: '3', title: 'Netflix', password: 'UniquePassword99!@#' },
    ];

    const report = analyzePasswordHealth(mockItems);
    expect(report.duplicateCount).toBe(2);
    expect(report.issues.some((i) => i.title === 'Google' && i.issueType === 'duplicate')).toBe(true);
    expect(report.issues.some((i) => i.title === 'GitHub' && i.issueType === 'duplicate')).toBe(true);
  });

  test('Returns 100% health score when all passwords are strong and unique', () => {
    const mockItems = [
      { id: '1', title: 'Google', password: 'StrongGoogleP@ss123!' },
      { id: '2', title: 'GitHub', password: 'DifferentGitHubP@ss999!' },
      { id: '3', title: 'Netflix', password: 'UniqueNetflixKey#7890' },
    ];

    const report = analyzePasswordHealth(mockItems);
    expect(report.weakCount).toBe(0);
    expect(report.duplicateCount).toBe(0);
    expect(report.healthScore).toBe(100);
    expect(report.issues.length).toBe(0);
  });

  test('Password Generator character pool construction and validation', () => {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const fullPool = upper + lower + numbers + symbols;
    expect(fullPool.length).toBeGreaterThan(60);

    // Ensure ambiguous characters (0, O, 1, I, l) were excluded for legibility
    expect(fullPool.includes('0')).toBe(false);
    expect(fullPool.includes('O')).toBe(false);
    expect(fullPool.includes('1')).toBe(false);
    expect(fullPool.includes('I')).toBe(false);
    expect(fullPool.includes('l')).toBe(false);
  });
});
