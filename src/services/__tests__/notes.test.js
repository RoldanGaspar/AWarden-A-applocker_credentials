/**
 * Life OS & Vault - Safe Markdown Notes Unit Tests
 */

describe('Markdown Notes Logic & Formatting Tests', () => {
  function stripMarkdown(md) {
    if (!md) return '';
    return md
      .replace(/^#+\s+/gm, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/\n+/g, ' ')
      .trim();
  }

  function getRelativeTime(timestamp, now = Date.now()) {
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return 'Older';
  }

  function filterAndSortNotes(notes, filters = {}) {
    let result = [...notes];

    if (filters.folderId) {
      result = result.filter((n) => n.folder_id === filters.folderId);
    }
    if (filters.onlyPinned) {
      result = result.filter((n) => n.is_pinned);
    }
    if (filters.onlyFavorites) {
      result = result.filter((n) => n.is_favorite);
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return result.sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
      if (a.is_favorite !== b.is_favorite) return b.is_favorite ? 1 : -1;
      return b.updated_at - a.updated_at;
    });
  }

  test('stripMarkdown correctly cleans headers, bold, code, and lists into plain preview text', () => {
    const markdown = `
# Project Vision 2026
This is a **critical** security feature with \`AES-256\` encryption.
- Feature A
- Feature B
> Note: Keep it offline.
    `;

    const plain = stripMarkdown(markdown);
    expect(plain).not.toContain('#');
    expect(plain).not.toContain('**');
    expect(plain).not.toContain('`');
    expect(plain).not.toContain('>');
    expect(plain).toContain('Project Vision 2026 This is a critical security feature with AES-256 encryption. Feature A Feature B Note: Keep it offline.');
  });

  test('getRelativeTime calculates human-friendly timestamps accurately', () => {
    const now = 1755420000000;
    expect(getRelativeTime(now - 30000, now)).toBe('Just now');
    expect(getRelativeTime(now - 15 * 60000, now)).toBe('15m ago');
    expect(getRelativeTime(now - 3 * 3600000, now)).toBe('3h ago');
    expect(getRelativeTime(now - 2 * 86400000, now)).toBe('2d ago');
  });

  test('filterAndSortNotes sorts pinned notes first, then favorites, then by date', () => {
    const mockNotes = [
      { id: '1', title: 'Regular Note', is_pinned: false, is_favorite: false, updated_at: 100 },
      { id: '2', title: 'Starred Note', is_pinned: false, is_favorite: true, updated_at: 200 },
      { id: '3', title: 'Pinned Note', is_pinned: true, is_favorite: false, updated_at: 50 },
    ];

    const sorted = filterAndSortNotes(mockNotes);
    expect(sorted[0].id).toBe('3'); // Pinned first
    expect(sorted[1].id).toBe('2'); // Starred second
    expect(sorted[2].id).toBe('1'); // Regular third
  });

  test('filterAndSortNotes matches search terms across title, content, and tags', () => {
    const mockNotes = [
      { id: '1', title: 'Cryptographic Architecture', content: 'Details about PBKDF2', tags: ['Security'], is_pinned: false, is_favorite: false, updated_at: 100 },
      { id: '2', title: 'Grocery List', content: 'Milk, Eggs, Bread', tags: ['Personal'], is_pinned: false, is_favorite: false, updated_at: 100 },
    ];

    const matchedByContent = filterAndSortNotes(mockNotes, { search: 'pbkdf2' });
    expect(matchedByContent.length).toBe(1);
    expect(matchedByContent[0].id).toBe('1');

    const matchedByTag = filterAndSortNotes(mockNotes, { search: 'security' });
    expect(matchedByTag.length).toBe(1);
    expect(matchedByTag[0].id).toBe('1');
  });
});
