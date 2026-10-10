/**
 * Life OS & Vault - Database Service
 * SQLite singleton with WAL mode, parameterized queries, and transparent AES-256 field encryption
 */

import * as SQLite from 'expo-sqlite';
import { CryptoService } from './cryptoService';
import {
  VaultItem,
  VaultFilterOptions,
  PasswordHealthReport,
  PasswordHealthIssue,
  Transaction,
  TransactionItem,
  TransactionType,
  TransactionFilterOptions,
  Category,
  CategoryItem,
  BudgetOverviewItem,
  CategorySpendingItem,
  MonthlySeriesItem,
  Note,
  NoteItem,
  NoteFilterOptions,
  Task,
  TaskItem,
  TaskStatus,
  TaskPriority,
  TaskFilterOptions,
  CalendarDayEvents,
  Folder,
  FolderItem,
  AuditLog,
  AuditLogItem,
  DashboardStats,
} from '../types/models';

export interface DemoDataSeedResult {
  vaultItems: number;
  transactions: number;
  notes: number;
  tasks: number;
  total: number;
}

export * from '../types/models';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  /**
   * Initialize SQLite connection and create tables
   */
  async init(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }

    try {
      this.db = await SQLite.openDatabaseAsync('applocker_vault.db');
      await this.db.execAsync('PRAGMA journal_mode = WAL;');

      await this.createTables(this.db);
      await this.seedDefaults(this.db);
      this.isInitialized = true;
      return this.db;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  private async createTables(db: SQLite.SQLiteDatabase): Promise<void> {
    const schema = `
      CREATE TABLE IF NOT EXISTS vault_items (
        id TEXT PRIMARY KEY NOT NULL,
        folder_id TEXT,
        title TEXT NOT NULL,
        username TEXT,
        password TEXT,
        url TEXT,
        notes TEXT,
        tags TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'PHP',
        category_id TEXT NOT NULL,
        date TEXT,
        payee_or_source TEXT,
        note TEXT,
        is_recurring INTEGER DEFAULT 0,
        recurring_frequency TEXT,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        icon TEXT,
        color TEXT,
        monthly_budget_limit REAL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY NOT NULL,
        folder_id TEXT,
        title TEXT NOT NULL,
        content TEXT,
        is_pinned INTEGER DEFAULT 0,
        is_favorite INTEGER DEFAULT 0,
        tags TEXT,
        created_at INTEGER,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','completed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high')),
        due_date TEXT,
        completed_at INTEGER,
        tags TEXT,
        created_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('vault','notes')),
        color TEXT,
        icon TEXT
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id TEXT,
        timestamp INTEGER
      );
    `;

    await db.execAsync(schema);
  }

  private async seedDefaults(db: SQLite.SQLiteDatabase): Promise<void> {
    // Check if categories exist
    const catRows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories;');
    if (catRows[0]?.count === 0) {
      const defaultCategories: Category[] = [
        { id: 'cat_salary', name: 'Salary & Earnings', type: 'income', icon: 'Briefcase', color: '#16A34A', monthly_budget_limit: null },
        { id: 'cat_freelance', name: 'Freelance & Side Gig', type: 'income', icon: 'DollarSign', color: '#0284C7', monthly_budget_limit: null },
        { id: 'cat_consulting', name: 'Consulting & Advisory', type: 'income', icon: 'TrendingUp', color: '#6366F1', monthly_budget_limit: null },
        { id: 'cat_investments', name: 'Investments & Dividends', type: 'income', icon: 'TrendingUp', color: '#8B5CF6', monthly_budget_limit: null },
        { id: 'cat_income_other', name: 'Other Income', type: 'income', icon: 'Wallet', color: '#10B981', monthly_budget_limit: null },
        { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#D97706', monthly_budget_limit: 15000 },
        { id: 'cat_housing', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#DC2626', monthly_budget_limit: 20000 },
        { id: 'cat_utilities', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#F59E0B', monthly_budget_limit: 5000 },
        { id: 'cat_transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#3B82F6', monthly_budget_limit: 4000 },
        { id: 'cat_shopping', name: 'Shopping & Personal', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', monthly_budget_limit: 6000 },
        { id: 'cat_health', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#10B981', monthly_budget_limit: 3000 },
        { id: 'cat_entertainment', name: 'Entertainment & Fun', type: 'expense', icon: 'Sparkles', color: '#8B5CF6', monthly_budget_limit: 4000 },
        { id: 'cat_travel', name: 'Travel & Vacation', type: 'expense', icon: 'Car', color: '#06B6D4', monthly_budget_limit: 10000 },
      ];

      for (const cat of defaultCategories) {
        await db.runAsync(
          'INSERT INTO categories (id, name, type, icon, color, monthly_budget_limit) VALUES (?, ?, ?, ?, ?, ?);',
          [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.monthly_budget_limit]
        );
      }
    }

    // Check if default folders exist
    const folderRows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM folders;');
    if (folderRows[0]?.count === 0) {
      const defaultFolders: Folder[] = [
        { id: 'folder_personal_vault', name: 'Personal Accounts', type: 'vault', color: '#3B82F6', icon: 'User' },
        { id: 'folder_work_vault', name: 'Work & Professional', type: 'vault', color: '#8B5CF6', icon: 'Briefcase' },
        { id: 'folder_finance_vault', name: 'Banking & Cards', type: 'vault', color: '#16A34A', icon: 'CreditCard' },
        { id: 'folder_personal_notes', name: 'Daily Journals', type: 'notes', color: '#4A7C59', icon: 'BookOpen' },
        { id: 'folder_ideas_notes', name: 'Projects & Ideas', type: 'notes', color: '#C86446', icon: 'Lightbulb' },
      ];

      for (const f of defaultFolders) {
        await db.runAsync(
          'INSERT INTO folders (id, name, type, color, icon) VALUES (?, ?, ?, ?, ?);',
          [f.id, f.name, f.type, f.color, f.icon]
        );
      }
    }
  }

  /**
   * Add a repeatable set of local-only records for UI previews.
   * Demo records use stable IDs and INSERT OR IGNORE so this is additive and idempotent.
   * Encrypted fields still use the active vault key, just like normal user-created data.
   */
  async seedDemoData(encryptionKey: string): Promise<DemoDataSeedResult> {
    if (!encryptionKey) {
      throw new Error('Encryption key is required to load demo data');
    }

    const db = await this.getDB();
    await this.seedDefaults(db);

    const now = Date.now();
    const today = new Date(now);
    const currentMonthDate = (day: number) => {
      const date = new Date(today);
      date.setDate(1);
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      date.setDate(Math.min(Math.max(day, 1), daysInMonth));
      return date.toISOString().split('T')[0];
    };
    const relativeDate = (offset: number) => {
      const date = new Date(today);
      date.setDate(date.getDate() + offset);
      return date.toISOString().split('T')[0];
    };

    const counts = {
      vaultItems: 0,
      transactions: 0,
      notes: 0,
      tasks: 0,
    };

    const demoVaultItems = [
      {
        id: 'demo_vault_workspace',
        folderId: 'folder_work_vault',
        title: 'Demo GitHub Workspace',
        username: 'demo.user@awarden.local',
        password: 'Demo-GitHub-2026!xQ',
        url: 'https://github.com',
        notes: 'Sample credential for previewing the vault card and detail view.',
        tags: ['Demo', 'Work'],
        isFavorite: true,
      },
      {
        id: 'demo_vault_streaming',
        folderId: 'folder_personal_vault',
        title: 'Demo Streaming Account',
        username: 'demo.viewer@awarden.local',
        password: 'Sample-Stream-88!zP',
        url: 'https://open.spotify.com',
        notes: 'Safe placeholder data only. This is not a real account.',
        tags: ['Demo', 'Personal'],
        isFavorite: false,
      },
      {
        id: 'demo_vault_bank',
        folderId: 'folder_finance_vault',
        title: 'Demo Bank Portal',
        username: 'demo.account@awarden.local',
        password: 'Sample-Bank-44!mR',
        url: 'https://example.com/banking',
        notes: 'Placeholder banking login for layout testing.',
        tags: ['Demo', 'Finance'],
        isFavorite: true,
      },
    ];

    const demoTransactions = [
      {
        id: 'demo_tx_salary',
        type: 'income' as TransactionType,
        amount: 48000,
        categoryId: 'cat_salary',
        date: currentMonthDate(2),
        payeeOrSource: 'Demo Company Payroll',
        note: 'Sample monthly salary income.',
        isRecurring: true,
        recurringFrequency: 'monthly',
      },
      {
        id: 'demo_tx_freelance',
        type: 'income' as TransactionType,
        amount: 12000,
        categoryId: 'cat_freelance',
        date: currentMonthDate(4),
        payeeOrSource: 'Demo Freelance Client',
        note: 'Sample side-project payment.',
        isRecurring: false,
        recurringFrequency: null,
      },
      {
        id: 'demo_tx_housing',
        type: 'expense' as TransactionType,
        amount: 18000,
        categoryId: 'cat_housing',
        date: currentMonthDate(3),
        payeeOrSource: 'Demo Apartment Rent',
        note: 'Sample housing expense.',
        isRecurring: true,
        recurringFrequency: 'monthly',
      },
      {
        id: 'demo_tx_food',
        type: 'expense' as TransactionType,
        amount: 1250,
        categoryId: 'cat_food',
        date: currentMonthDate(5),
        payeeOrSource: 'Weekend Market',
        note: 'Sample groceries and dining expense.',
        isRecurring: false,
        recurringFrequency: null,
      },
      {
        id: 'demo_tx_transport',
        type: 'expense' as TransactionType,
        amount: 680,
        categoryId: 'cat_transport',
        date: currentMonthDate(6),
        payeeOrSource: 'City Transit',
        note: 'Sample transportation expense.',
        isRecurring: false,
        recurringFrequency: null,
      },
      {
        id: 'demo_tx_entertainment',
        type: 'expense' as TransactionType,
        amount: 899,
        categoryId: 'cat_entertainment',
        date: currentMonthDate(7),
        payeeOrSource: 'Demo Music Subscription',
        note: 'Sample recurring entertainment expense.',
        isRecurring: true,
        recurringFrequency: 'monthly',
      },
      {
        id: 'demo_tx_shopping',
        type: 'expense' as TransactionType,
        amount: 2450,
        categoryId: 'cat_shopping',
        date: currentMonthDate(8),
        payeeOrSource: 'Home Office Refresh',
        note: 'Sample personal shopping expense.',
        isRecurring: false,
        recurringFrequency: null,
      },
    ];

    const demoNotes = [
      {
        id: 'demo_note_reset',
        folderId: 'folder_personal_notes',
        title: 'Demo Monthly Reset',
        content: '# Monthly reset\n\n- Review this month\'s spending\n- Refresh the backup\n- Pick three priorities for next month\n\n> Demo content for previewing markdown notes.',
        isPinned: true,
        isFavorite: true,
        tags: ['Demo', 'Planning'],
      },
      {
        id: 'demo_note_project',
        folderId: 'folder_ideas_notes',
        title: 'Demo Product Ideas',
        content: '## Product ideas\n\n1. Simplify the first-run experience\n2. Add a visual weekly review\n3. Keep every interaction local-first\n\n#ideas #demo',
        isPinned: false,
        isFavorite: true,
        tags: ['Demo', 'Ideas'],
      },
      {
        id: 'demo_note_trip',
        folderId: 'folder_personal_notes',
        title: 'Demo Weekend Plan',
        content: 'A short sample note with enough copy to preview card wrapping, tags, and the editor surface.',
        isPinned: false,
        isFavorite: false,
        tags: ['Demo', 'Personal'],
      },
    ];

    const demoTasks = [
      {
        id: 'demo_task_review',
        title: 'Review monthly spending',
        description: 'Compare the sample ledger entries with this month\'s budget limits.',
        status: 'in_progress' as TaskStatus,
        priority: 'high' as TaskPriority,
        dueDate: relativeDate(1),
        completedAt: null,
        tags: ['Demo', 'Finance'],
      },
      {
        id: 'demo_task_backup',
        title: 'Create encrypted backup',
        description: 'Export a fresh local backup after reviewing the sample records.',
        status: 'todo' as TaskStatus,
        priority: 'high' as TaskPriority,
        dueDate: relativeDate(3),
        completedAt: null,
        tags: ['Demo', 'Security'],
      },
      {
        id: 'demo_task_autopay',
        title: 'Move recurring bills to autopay',
        description: 'A medium-priority task to demonstrate longer card text and metadata.',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        dueDate: relativeDate(5),
        completedAt: null,
        tags: ['Demo', 'Admin'],
      },
      {
        id: 'demo_task_archive',
        title: 'Archive old receipts',
        description: 'Completed sample task for the workflow board.',
        status: 'completed' as TaskStatus,
        priority: 'low' as TaskPriority,
        dueDate: relativeDate(-2),
        completedAt: now - 2 * 60 * 60 * 1000,
        tags: ['Demo', 'Cleanup'],
      },
      {
        id: 'demo_task_plan',
        title: 'Plan the next weekly review',
        description: 'Use the notes and ledger screens to prepare a calm weekly reset.',
        status: 'in_progress' as TaskStatus,
        priority: 'medium' as TaskPriority,
        dueDate: relativeDate(7),
        completedAt: null,
        tags: ['Demo', 'Planning'],
      },
      {
        id: 'demo_task_domain',
        title: 'Renew workspace domain',
        description: 'Sample upcoming task with a compact title.',
        status: 'todo' as TaskStatus,
        priority: 'low' as TaskPriority,
        dueDate: relativeDate(10),
        completedAt: null,
        tags: ['Demo', 'Work'],
      },
    ];

    await db.withTransactionAsync(async () => {
      for (const item of demoVaultItems) {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO vault_items
           (id, folder_id, title, username, password, url, notes, tags, is_favorite, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.folderId,
            item.title,
            CryptoService.encryptData(item.username, encryptionKey),
            CryptoService.encryptData(item.password, encryptionKey),
            item.url,
            CryptoService.encryptData(item.notes, encryptionKey),
            JSON.stringify(item.tags),
            item.isFavorite ? 1 : 0,
            now - 1000,
            now - 1000,
          ]
        );
        counts.vaultItems += result.changes;
      }

      for (const item of demoTransactions) {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO transactions
           (id, type, amount, currency, category_id, date, payee_or_source, note, is_recurring, recurring_frequency, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.type,
            item.amount,
            'PHP',
            item.categoryId,
            item.date,
            item.payeeOrSource,
            CryptoService.encryptData(item.note, encryptionKey),
            item.isRecurring ? 1 : 0,
            item.recurringFrequency,
            now,
          ]
        );
        counts.transactions += result.changes;
      }

      for (const item of demoNotes) {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO notes
           (id, folder_id, title, content, is_pinned, is_favorite, tags, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.folderId,
            item.title,
            CryptoService.encryptData(item.content, encryptionKey),
            item.isPinned ? 1 : 0,
            item.isFavorite ? 1 : 0,
            JSON.stringify(item.tags),
            now,
            now,
          ]
        );
        counts.notes += result.changes;
      }

      for (const item of demoTasks) {
        const result = await db.runAsync(
          `INSERT OR IGNORE INTO tasks
           (id, title, description, status, priority, due_date, completed_at, tags, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            item.id,
            item.title,
            item.description ? CryptoService.encryptData(item.description, encryptionKey) : null,
            item.status,
            item.priority,
            item.dueDate,
            item.completedAt,
            JSON.stringify(item.tags),
            now,
          ]
        );
        counts.tasks += result.changes;
      }
    });

    await this.setSetting('demo_data_loaded_at', String(now));
    await this.addAuditLog('demo_data_loaded', 'demo_data', 'demo_preview');

    return {
      ...counts,
      total: counts.vaultItems + counts.transactions + counts.notes + counts.tasks,
    };
  }

  private async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      return await this.init();
    }
    return this.db;
  }

  // ==========================================
  // AUDIT LOGS & SETTINGS ALIASES
  // ==========================================
  async addAuditLog(action: string, entity_type?: string | null, entity_id?: string | null): Promise<void> {
    try {
      const db = await this.getDB();
      const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await db.runAsync(
        'INSERT INTO audit_logs (id, action, entity_type, entity_id, timestamp) VALUES (?, ?, ?, ?, ?);',
        [id, action, entity_type || null, entity_id || null, Date.now()]
      );
    } catch (e) {
      console.warn('Failed to insert audit log:', e);
    }
  }

  async getAppSetting(key: string): Promise<string | null> {
    return this.getSetting(key);
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    return this.setSetting(key, value);
  }

  // ==========================================
  // DASHBOARD QUERY FUNCTIONS
  // ==========================================
  async getDashboardStats(): Promise<DashboardStats> {
    const db = await this.getDB();
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [vaultCountRow, notesCountRow, tasksCountRow, transRows, backupRow, nameRow] = await Promise.all([
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM vault_items;'),
      db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM notes;'),
      db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM tasks WHERE status != 'completed';`),
      db.getAllAsync<{ type: 'income' | 'expense'; total: number }>(
        'SELECT type, SUM(amount) as total FROM transactions WHERE date LIKE ? GROUP BY type;',
        [`${currentMonth}%`]
      ),
      db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'last_backup_timestamp';`),
      db.getFirstAsync<{ value: string }>(`SELECT value FROM app_settings WHERE key = 'user_display_name';`),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const r of transRows) {
      if (r.type === 'income') totalIncome = r.total || 0;
      if (r.type === 'expense') totalExpense = r.total || 0;
    }

    const lastBackupTimestamp = backupRow?.value ? parseInt(backupRow.value, 10) : null;
    const userDisplayName = nameRow?.value || 'Ren';

    return {
      netBalance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      vaultCount: vaultCountRow?.count || 0,
      openTasksCount: tasksCountRow?.count || 0,
      notesCount: notesCountRow?.count || 0,
      lastBackupTimestamp,
      userDisplayName,
    };
  }

  async getRecentTransactions(encryptionKey: string, limit = 5): Promise<Transaction[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      `SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ?;`,
      [limit]
    );

    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      currency: r.currency || 'PHP',
      category_id: r.category_id,
      categoryName: r.category_name || 'General',
      categoryColor: r.category_color || '#3B82F6',
      categoryIcon: r.category_icon || 'DollarSign',
      date: r.date,
      payee_or_source: r.payee_or_source,
      note: r.note ? CryptoService.decryptData(r.note, encryptionKey) : null,
      is_recurring: !!r.is_recurring,
      recurring_frequency: r.recurring_frequency,
      created_at: r.created_at,
    }));
  }

  async getRecentVaultItems(encryptionKey: string, limit = 3): Promise<VaultItem[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM vault_items ORDER BY updated_at DESC LIMIT ?;',
      [limit]
    );

    return rows.map((r) => ({
      id: r.id,
      folder_id: r.folder_id,
      title: r.title,
      username: CryptoService.decryptData(r.username || '', encryptionKey),
      password: CryptoService.decryptData(r.password || '', encryptionKey),
      url: r.url,
      notes: r.notes ? CryptoService.decryptData(r.notes, encryptionKey) : null,
      tags: r.tags ? JSON.parse(r.tags) : [],
      is_favorite: !!r.is_favorite,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  }

  async getUpcomingTasks(encryptionKey: string, limit = 3): Promise<Task[]> {
    const db = await this.getDB();

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM tasks
       WHERE status != 'completed'
       ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, priority DESC
       LIMIT ?;`,
      [limit]
    );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ? CryptoService.decryptData(r.description, encryptionKey) : null,
      status: r.status,
      priority: r.priority,
      due_date: r.due_date,
      completed_at: r.completed_at,
      tags: r.tags ? JSON.parse(r.tags) : [],
      created_at: r.created_at,
    }));
  }

  // ==========================================
  // VAULT ITEMS CRUD & FILTERING (Phase 4)
  // ==========================================
  async getVaultItems(
    encryptionKey: string,
    filters?: VaultFilterOptions
  ): Promise<VaultItem[]> {
    const db = await this.getDB();
    let query = 'SELECT * FROM vault_items WHERE 1=1';
    const params: any[] = [];

    if (filters?.folderId) {
      query += ' AND folder_id = ?';
      params.push(filters.folderId);
    }

    if (filters?.onlyFavorites) {
      query += ' AND is_favorite = 1';
    }

    const sortField = filters?.sortBy || 'updated_at';
    const sortDir = filters?.sortDirection === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY is_favorite DESC, ${sortField} ${sortDir};`;

    const rows = await db.getAllAsync<any>(query, params);

    let items: VaultItem[] = rows.map((r) => ({
      id: r.id,
      folder_id: r.folder_id,
      title: r.title,
      username: CryptoService.decryptData(r.username || '', encryptionKey),
      password: CryptoService.decryptData(r.password || '', encryptionKey),
      url: r.url,
      notes: r.notes ? CryptoService.decryptData(r.notes, encryptionKey) : null,
      tags: r.tags ? JSON.parse(r.tags) : [],
      is_favorite: !!r.is_favorite,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    // In-memory filter for search query and tags (matching decrypted contents)
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.username.toLowerCase().includes(q) ||
          (i.url && i.url.toLowerCase().includes(q)) ||
          (i.notes && i.notes.toLowerCase().includes(q)) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters?.tag) {
      const targetTag = filters.tag.toLowerCase();
      items = items.filter((i) => i.tags.some((t) => t.toLowerCase() === targetTag));
    }

    return items;
  }

  async getVaultItemById(id: string, encryptionKey: string): Promise<VaultItem | null> {
    const db = await this.getDB();
    const row = await db.getFirstAsync<any>('SELECT * FROM vault_items WHERE id = ?;', [id]);
    if (!row) return null;

    return {
      id: row.id,
      folder_id: row.folder_id,
      title: row.title,
      username: CryptoService.decryptData(row.username || '', encryptionKey),
      password: CryptoService.decryptData(row.password || '', encryptionKey),
      url: row.url,
      notes: row.notes ? CryptoService.decryptData(row.notes, encryptionKey) : null,
      tags: row.tags ? JSON.parse(row.tags) : [],
      is_favorite: !!row.is_favorite,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async createVaultItem(
    item: Omit<VaultItem, 'created_at' | 'updated_at'>,
    encryptionKey: string
  ): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();

    const encUsername = CryptoService.encryptData(item.username, encryptionKey);
    const encPassword = CryptoService.encryptData(item.password, encryptionKey);
    const encNotes = item.notes ? CryptoService.encryptData(item.notes, encryptionKey) : null;
    const tagsJson = JSON.stringify(item.tags || []);

    await db.runAsync(
      `INSERT INTO vault_items (id, folder_id, title, username, password, url, notes, tags, is_favorite, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.id,
        item.folder_id,
        item.title,
        encUsername,
        encPassword,
        item.url,
        encNotes,
        tagsJson,
        item.is_favorite ? 1 : 0,
        now,
        now,
      ]
    );

    await this.addAuditLog('vault_item_created', 'vault_item', item.id);
  }

  async updateVaultItem(item: VaultItem, encryptionKey: string): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();

    const encUsername = CryptoService.encryptData(item.username, encryptionKey);
    const encPassword = CryptoService.encryptData(item.password, encryptionKey);
    const encNotes = item.notes ? CryptoService.encryptData(item.notes, encryptionKey) : null;
    const tagsJson = JSON.stringify(item.tags || []);

    await db.runAsync(
      `UPDATE vault_items
       SET folder_id = ?, title = ?, username = ?, password = ?, url = ?, notes = ?, tags = ?, is_favorite = ?, updated_at = ?
       WHERE id = ?;`,
      [
        item.folder_id,
        item.title,
        encUsername,
        encPassword,
        item.url,
        encNotes,
        tagsJson,
        item.is_favorite ? 1 : 0,
        now,
        item.id,
      ]
    );

    await this.addAuditLog('vault_item_updated', 'vault_item', item.id);
  }

  async toggleVaultFavorite(id: string, isFavorite: boolean): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE vault_items SET is_favorite = ?, updated_at = ? WHERE id = ?;',
      [isFavorite ? 1 : 0, Date.now(), id]
    );
    await this.addAuditLog('vault_item_favorite_toggled', 'vault_item', id);
  }

  async deleteVaultItem(id: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM vault_items WHERE id = ?;', [id]);
    await this.addAuditLog('vault_item_deleted', 'vault_item', id);
  }

  // ==========================================
  // PASSWORD HEALTH AUDITOR
  // ==========================================
  async getPasswordHealth(encryptionKey: string): Promise<PasswordHealthReport> {
    const items = await this.getVaultItems(encryptionKey);
    const issues: PasswordHealthIssue[] = [];

    const passwordMap = new Map<string, VaultItem[]>();

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
          username: item.username,
          issueType: 'weak',
          reason: `Password is only ${pwd.length} characters (min 8 required)`,
        });
      } else if (charClassCount <= 1) {
        issues.push({
          itemId: item.id,
          title: item.title,
          username: item.username,
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
          const otherTitles = group.filter((g) => g.id !== item.id).map((g) => g.title).join(', ');
          issues.push({
            itemId: item.id,
            title: item.title,
            username: item.username,
            issueType: 'duplicate',
            reason: `Reused password matching: ${otherTitles}`,
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

  // ==========================================
  // FOLDERS CRUD
  // ==========================================
  async getFolders(type?: 'vault' | 'notes'): Promise<Folder[]> {
    const db = await this.getDB();
    if (type) {
      return await db.getAllAsync<Folder>('SELECT * FROM folders WHERE type = ? ORDER BY name ASC;', [type]);
    }
    return await db.getAllAsync<Folder>('SELECT * FROM folders ORDER BY name ASC;');
  }

  async createFolder(folder: Folder): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'INSERT INTO folders (id, name, type, color, icon) VALUES (?, ?, ?, ?, ?);',
      [folder.id, folder.name, folder.type, folder.color, folder.icon]
    );
    await this.addAuditLog('folder_created', 'folder', folder.id);
  }

  async updateFolder(folder: Folder): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE folders SET name = ?, color = ?, icon = ? WHERE id = ?;',
      [folder.name, folder.color, folder.icon, folder.id]
    );
    await this.addAuditLog('folder_updated', 'folder', folder.id);
  }

  async deleteFolder(id: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('UPDATE vault_items SET folder_id = NULL WHERE folder_id = ?;', [id]);
    await db.runAsync('UPDATE notes SET folder_id = NULL WHERE folder_id = ?;', [id]);
    await db.runAsync('DELETE FROM folders WHERE id = ?;', [id]);
    await this.addAuditLog('folder_deleted', 'folder', id);
  }

  // ==========================================
  // TRANSACTIONS CRUD & FILTERING (Phase 5)
  // ==========================================
  async getTransactions(
    encryptionKey: string,
    filters?: TransactionFilterOptions
  ): Promise<Transaction[]> {
    const db = await this.getDB();
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.type && filters.type !== 'all') {
      query += ' AND t.type = ?';
      params.push(filters.type);
    }

    if (filters?.categoryId) {
      query += ' AND t.category_id = ?';
      params.push(filters.categoryId);
    }

    if (filters?.isRecurring !== undefined) {
      query += ' AND t.is_recurring = ?';
      params.push(filters.isRecurring ? 1 : 0);
    }

    // Date range filtering
    if (filters?.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      if (filters.dateRange === 'this_month') {
        const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        query += ' AND t.date LIKE ?';
        params.push(`${prefix}%`);
      } else if (filters.dateRange === 'last_month') {
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        query += ' AND t.date LIKE ?';
        params.push(`${prefix}%`);
      } else if (filters.dateRange === 'this_year') {
        query += ' AND t.date LIKE ?';
        params.push(`${now.getFullYear()}%`);
      }
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC;';

    const rows = await db.getAllAsync<any>(query, params);

    let items: Transaction[] = rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      currency: r.currency || 'PHP',
      category_id: r.category_id,
      categoryName: r.category_name || 'General',
      categoryColor: r.category_color || '#3B82F6',
      categoryIcon: r.category_icon || 'DollarSign',
      date: r.date,
      payee_or_source: r.payee_or_source,
      note: r.note ? CryptoService.decryptData(r.note, encryptionKey) : null,
      is_recurring: !!r.is_recurring,
      recurring_frequency: r.recurring_frequency,
      created_at: r.created_at,
    }));

    // In-memory search matching payee_or_source, decrypted note, and category name
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (t) =>
          (t.payee_or_source && t.payee_or_source.toLowerCase().includes(q)) ||
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.categoryName && t.categoryName.toLowerCase().includes(q))
      );
    }

    return items;
  }

  async createTransaction(
    item: Omit<Transaction, 'created_at'>,
    encryptionKey: string
  ): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();
    const encNote = item.note ? CryptoService.encryptData(item.note, encryptionKey) : null;

    await db.runAsync(
      `INSERT INTO transactions (id, type, amount, currency, category_id, date, payee_or_source, note, is_recurring, recurring_frequency, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        item.id,
        item.type,
        item.amount,
        item.currency || 'PHP',
        item.category_id,
        item.date,
        item.payee_or_source,
        encNote,
        item.is_recurring ? 1 : 0,
        item.recurring_frequency || null,
        now,
      ]
    );

    await this.addAuditLog('transaction_created', 'transaction', item.id);
  }

  async updateTransaction(
    item: Transaction,
    encryptionKey: string
  ): Promise<void> {
    const db = await this.getDB();
    const encNote = item.note ? CryptoService.encryptData(item.note, encryptionKey) : null;

    await db.runAsync(
      `UPDATE transactions
       SET type = ?, amount = ?, currency = ?, category_id = ?, date = ?, payee_or_source = ?, note = ?, is_recurring = ?, recurring_frequency = ?
       WHERE id = ?;`,
      [
        item.type,
        item.amount,
        item.currency || 'PHP',
        item.category_id,
        item.date,
        item.payee_or_source,
        encNote,
        item.is_recurring ? 1 : 0,
        item.recurring_frequency || null,
        item.id,
      ]
    );

    await this.addAuditLog('transaction_updated', 'transaction', item.id);
  }

  async duplicateTransaction(id: string, encryptionKey: string): Promise<void> {
    const db = await this.getDB();
    const existing = await db.getFirstAsync<any>('SELECT * FROM transactions WHERE id = ?;', [id]);
    if (!existing) return;

    const today = new Date().toISOString().split('T')[0];
    const plainNote = existing.note ? CryptoService.decryptData(existing.note, encryptionKey) : '';
    const newNote = plainNote ? `${plainNote} (Copy)` : 'Copy';

    const newId = `tx_${Date.now()}`;
    await this.createTransaction(
      {
        id: newId,
        type: existing.type,
        amount: existing.amount,
        currency: existing.currency,
        category_id: existing.category_id,
        date: today,
        payee_or_source: existing.payee_or_source,
        note: newNote,
        is_recurring: !!existing.is_recurring,
        recurring_frequency: existing.recurring_frequency,
      },
      encryptionKey
    );

    await this.addAuditLog('transaction_duplicated', 'transaction', newId);
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
    await this.addAuditLog('transaction_deleted', 'transaction', id);
  }

  // ==========================================
  // BUDGET OVERVIEW & INSIGHTS (Phase 5)
  // ==========================================
  async getBudgetOverview(monthPrefix: string): Promise<BudgetOverviewItem[]> {
    const db = await this.getDB();

    const categories = await db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE type = 'expense' AND monthly_budget_limit > 0;`
    );

    const spentRows = await db.getAllAsync<{ category_id: string; total: number }>(
      `SELECT category_id, SUM(amount) as total
       FROM transactions
       WHERE type = 'expense' AND date LIKE ?
       GROUP BY category_id;`,
      [`${monthPrefix}%`]
    );

    const spentMap = new Map<string, number>();
    spentRows.forEach((r) => spentMap.set(r.category_id, r.total || 0));

    return categories.map((cat) => {
      const limit = cat.monthly_budget_limit || 0;
      const spent = spentMap.get(cat.id) || 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      let status: 'safe' | 'warning' | 'over' = 'safe';
      if (percentage >= 100) status = 'over';
      else if (percentage >= 80) status = 'warning';

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        limit,
        spent,
        percentage,
        status,
      };
    });
  }

  async getSpendingByCategory(monthPrefix: string): Promise<CategorySpendingItem[]> {
    const db = await this.getDB();

    const rows = await db.getAllAsync<{
      category_id: string;
      category_name: string;
      category_color: string;
      category_icon: string;
      total: number;
    }>(
      `SELECT t.category_id, c.name as category_name, c.color as category_color, c.icon as category_icon, SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = 'expense' AND t.date LIKE ?
       GROUP BY t.category_id
       ORDER BY total DESC;`,
      [`${monthPrefix}%`]
    );

    const grandTotal = rows.reduce((acc, r) => acc + (r.total || 0), 0);

    return rows.map((r) => ({
      categoryId: r.category_id,
      categoryName: r.category_name || 'General',
      categoryColor: r.category_color || '#3B82F6',
      categoryIcon: r.category_icon || 'DollarSign',
      totalAmount: r.total || 0,
      percentage: grandTotal > 0 ? ((r.total || 0) / grandTotal) * 100 : 0,
    }));
  }

  async getMonthlyIncomeExpenseSeries(monthCount = 6): Promise<MonthlySeriesItem[]> {
    const db = await this.getDB();
    const result: MonthlySeriesItem[] = [];

    const now = new Date();
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('en-US', { month: 'short' });

      const rows = await db.getAllAsync<{ type: 'income' | 'expense'; total: number }>(
        'SELECT type, SUM(amount) as total FROM transactions WHERE date LIKE ? GROUP BY type;',
        [`${monthKey}%`]
      );

      let inc = 0;
      let exp = 0;
      for (const r of rows) {
        if (r.type === 'income') inc = r.total || 0;
        if (r.type === 'expense') exp = r.total || 0;
      }

      result.push({
        monthKey,
        monthLabel,
        income: inc,
        expense: exp,
        net: inc - exp,
      });
    }

    return result;
  }

  async getFinancialSummary(currentMonthIsoPrefix: string): Promise<{
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
  }> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<{ type: 'income' | 'expense'; total: number }>(
      `SELECT type, SUM(amount) as total FROM transactions WHERE date LIKE ? GROUP BY type;`,
      [`${currentMonthIsoPrefix}%`]
    );

    let totalIncome = 0;
    let totalExpense = 0;

    for (const r of rows) {
      if (r.type === 'income') totalIncome = r.total || 0;
      if (r.type === 'expense') totalExpense = r.total || 0;
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
    };
  }

  // ==========================================
  // CATEGORIES CRUD (Phase 5)
  // ==========================================
  async getCategories(type?: TransactionType): Promise<Category[]> {
    const db = await this.getDB();
    if (type) {
      return await db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY name ASC;', [type]);
    }
    return await db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type ASC, name ASC;');
  }

  async createCategory(cat: Category): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'INSERT INTO categories (id, name, type, icon, color, monthly_budget_limit) VALUES (?, ?, ?, ?, ?, ?);',
      [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.monthly_budget_limit]
    );
    await this.addAuditLog('category_created', 'category', cat.id);
  }

  async updateCategory(cat: Category): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE categories SET name = ?, type = ?, icon = ?, color = ?, monthly_budget_limit = ? WHERE id = ?;',
      [cat.name, cat.type, cat.icon, cat.color, cat.monthly_budget_limit, cat.id]
    );
    await this.addAuditLog('category_updated', 'category', cat.id);
  }

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const db = await this.getDB();
    const [usageRow] = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?;',
      [id]
    );

    if (usageRow && usageRow.count > 0) {
      return {
        success: false,
        error: `Cannot delete category: ${usageRow.count} transaction(s) are assigned to it. Please reassign them first.`,
      };
    }

    await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
    await this.addAuditLog('category_deleted', 'category', id);
    return { success: true };
  }

  // ==========================================
  // NOTES CRUD & FILTERING (Phase 6)
  // ==========================================
  async getNotes(
    encryptionKey: string,
    filters?: NoteFilterOptions
  ): Promise<Note[]> {
    const db = await this.getDB();
    let query = 'SELECT * FROM notes WHERE 1=1';
    const params: any[] = [];

    if (filters?.folderId) {
      query += ' AND folder_id = ?';
      params.push(filters.folderId);
    }

    if (filters?.onlyPinned) {
      query += ' AND is_pinned = 1';
    }

    if (filters?.onlyFavorites) {
      query += ' AND is_favorite = 1';
    }

    const sortField = filters?.sortBy || 'updated_at';
    const sortDir = filters?.sortDirection === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY is_pinned DESC, is_favorite DESC, ${sortField} ${sortDir};`;

    const rows = await db.getAllAsync<any>(query, params);

    let items: Note[] = rows.map((r) => ({
      id: r.id,
      folder_id: r.folder_id,
      title: r.title,
      content: CryptoService.decryptData(r.content || '', encryptionKey),
      is_pinned: !!r.is_pinned,
      is_favorite: !!r.is_favorite,
      tags: r.tags ? JSON.parse(r.tags) : [],
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    // In-memory filter for search query and tags (matching decrypted contents)
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filters?.tag) {
      const targetTag = filters.tag.toLowerCase();
      items = items.filter((n) => n.tags.some((t) => t.toLowerCase() === targetTag));
    }

    return items;
  }

  async getNoteById(id: string, encryptionKey: string): Promise<Note | null> {
    const db = await this.getDB();
    const row = await db.getFirstAsync<any>('SELECT * FROM notes WHERE id = ?;', [id]);
    if (!row) return null;

    return {
      id: row.id,
      folder_id: row.folder_id,
      title: row.title,
      content: CryptoService.decryptData(row.content || '', encryptionKey),
      is_pinned: !!row.is_pinned,
      is_favorite: !!row.is_favorite,
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  async createNote(
    note: Omit<Note, 'created_at' | 'updated_at'>,
    encryptionKey: string
  ): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();
    const encContent = CryptoService.encryptData(note.content, encryptionKey);
    const tagsJson = JSON.stringify(note.tags || []);

    await db.runAsync(
      `INSERT INTO notes (id, folder_id, title, content, is_pinned, is_favorite, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        note.id,
        note.folder_id,
        note.title,
        encContent,
        note.is_pinned ? 1 : 0,
        note.is_favorite ? 1 : 0,
        tagsJson,
        now,
        now,
      ]
    );

    await this.addAuditLog('note_created', 'note', note.id);
  }

  async updateNote(note: Note, encryptionKey: string): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();
    const encContent = CryptoService.encryptData(note.content, encryptionKey);
    const tagsJson = JSON.stringify(note.tags || []);

    await db.runAsync(
      `UPDATE notes
       SET folder_id = ?, title = ?, content = ?, is_pinned = ?, is_favorite = ?, tags = ?, updated_at = ?
       WHERE id = ?;`,
      [
        note.folder_id,
        note.title,
        encContent,
        note.is_pinned ? 1 : 0,
        note.is_favorite ? 1 : 0,
        tagsJson,
        now,
        note.id,
      ]
    );

    await this.addAuditLog('note_updated', 'note', note.id);
  }

  async toggleNotePin(id: string, isPinned: boolean): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE notes SET is_pinned = ?, updated_at = ? WHERE id = ?;',
      [isPinned ? 1 : 0, Date.now(), id]
    );
    await this.addAuditLog('note_pinned_toggled', 'note', id);
  }

  async toggleNoteFavorite(id: string, isFavorite: boolean): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE notes SET is_favorite = ?, updated_at = ? WHERE id = ?;',
      [isFavorite ? 1 : 0, Date.now(), id]
    );
    await this.addAuditLog('note_favorite_toggled', 'note', id);
  }

  async duplicateNote(id: string, encryptionKey: string): Promise<void> {
    const db = await this.getDB();
    const existing = await db.getFirstAsync<any>('SELECT * FROM notes WHERE id = ?;', [id]);
    if (!existing) return;

    const plainContent = CryptoService.decryptData(existing.content || '', encryptionKey);
    const newId = `note_${Date.now()}`;
    const tags = existing.tags ? JSON.parse(existing.tags) : [];

    await this.createNote(
      {
        id: newId,
        folder_id: existing.folder_id,
        title: `${existing.title} (Copy)`,
        content: plainContent,
        is_pinned: false,
        is_favorite: false,
        tags,
      },
      encryptionKey
    );

    await this.addAuditLog('note_duplicated', 'note', newId);
  }

  async deleteNote(id: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM notes WHERE id = ?;', [id]);
    await this.addAuditLog('note_deleted', 'note', id);
  }

  // ==========================================
  // TASKS & KANBAN CRUD (Phase 7)
  // ==========================================
  async getTasks(
    encryptionKey: string,
    filters?: TaskFilterOptions
  ): Promise<Task[]> {
    const db = await this.getDB();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (filters?.status && filters.status !== 'all') {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    // Due range filtering
    if (filters?.dueRange && filters.dueRange !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      if (filters.dueRange === 'overdue') {
        query += ` AND due_date < ? AND status != 'completed'`;
        params.push(today);
      } else if (filters.dueRange === 'today') {
        query += ' AND due_date = ?';
        params.push(today);
      } else if (filters.dueRange === 'upcoming') {
        query += ' AND due_date >= ?';
        params.push(today);
      }
    }

    query += ` ORDER BY CASE status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END, CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, priority DESC;`;

    const rows = await db.getAllAsync<any>(query, params);

    let items: Task[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ? CryptoService.decryptData(r.description, encryptionKey) : null,
      status: r.status,
      priority: r.priority,
      due_date: r.due_date,
      completed_at: r.completed_at,
      tags: r.tags ? JSON.parse(r.tags) : [],
      created_at: r.created_at,
    }));

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filters?.tag) {
      const targetTag = filters.tag.toLowerCase();
      items = items.filter((t) => t.tags.some((tag) => tag.toLowerCase() === targetTag));
    }

    return items;
  }

  async getTaskById(id: string, encryptionKey: string): Promise<Task | null> {
    const db = await this.getDB();
    const row = await db.getFirstAsync<any>('SELECT * FROM tasks WHERE id = ?;', [id]);
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description ? CryptoService.decryptData(row.description, encryptionKey) : null,
      status: row.status,
      priority: row.priority,
      due_date: row.due_date,
      completed_at: row.completed_at,
      tags: row.tags ? JSON.parse(row.tags) : [],
      created_at: row.created_at,
    };
  }

  async createTask(
    task: Omit<Task, 'created_at'>,
    encryptionKey: string
  ): Promise<void> {
    const db = await this.getDB();
    const now = Date.now();
    const encDesc = task.description ? CryptoService.encryptData(task.description, encryptionKey) : null;
    const tagsJson = JSON.stringify(task.tags || []);

    await db.runAsync(
      `INSERT INTO tasks (id, title, description, status, priority, due_date, completed_at, tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        task.id,
        task.title,
        encDesc,
        task.status,
        task.priority,
        task.due_date,
        task.completed_at,
        tagsJson,
        now,
      ]
    );

    await this.addAuditLog('task_created', 'task', task.id);
  }

  async updateTask(task: Task, encryptionKey: string): Promise<void> {
    const db = await this.getDB();
    const encDesc = task.description ? CryptoService.encryptData(task.description, encryptionKey) : null;
    const tagsJson = JSON.stringify(task.tags || []);

    await db.runAsync(
      `UPDATE tasks
       SET title = ?, description = ?, status = ?, priority = ?, due_date = ?, completed_at = ?, tags = ?
       WHERE id = ?;`,
      [
        task.title,
        encDesc,
        task.status,
        task.priority,
        task.due_date,
        task.completed_at,
        tagsJson,
        task.id,
      ]
    );

    await this.addAuditLog('task_updated', 'task', task.id);
  }

  async updateTaskStatus(id: string, newStatus: TaskStatus): Promise<void> {
    const db = await this.getDB();
    const completedAt = newStatus === 'completed' ? Date.now() : null;

    await db.runAsync(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?;',
      [newStatus, completedAt, id]
    );

    await this.addAuditLog(`task_status_${newStatus}`, 'task', id);
  }

  async duplicateTask(id: string, encryptionKey: string): Promise<void> {
    const db = await this.getDB();
    const existing = await db.getFirstAsync<any>('SELECT * FROM tasks WHERE id = ?;', [id]);
    if (!existing) return;

    const plainDesc = existing.description ? CryptoService.decryptData(existing.description, encryptionKey) : null;
    const newId = `task_${Date.now()}`;
    const tags = existing.tags ? JSON.parse(existing.tags) : [];

    await this.createTask(
      {
        id: newId,
        title: `${existing.title} (Copy)`,
        description: plainDesc,
        status: 'todo',
        priority: existing.priority,
        due_date: existing.due_date,
        completed_at: null,
        tags,
      },
      encryptionKey
    );

    await this.addAuditLog('task_duplicated', 'task', newId);
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM tasks WHERE id = ?;', [id]);
    await this.addAuditLog('task_deleted', 'task', id);
  }

  // ==========================================
  // UNIFIED CALENDAR QUERIES (Phase 7)
  // ==========================================
  async getTasksForMonth(encryptionKey: string, year: number, month: number): Promise<Task[]> {
    const db = await this.getDB();
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const rows = await db.getAllAsync<any>(
      'SELECT * FROM tasks WHERE due_date LIKE ? ORDER BY due_date ASC, priority DESC;',
      [`${monthPrefix}%`]
    );

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ? CryptoService.decryptData(r.description, encryptionKey) : null,
      status: r.status,
      priority: r.priority,
      due_date: r.due_date,
      completed_at: r.completed_at,
      tags: r.tags ? JSON.parse(r.tags) : [],
      created_at: r.created_at,
    }));
  }

  async getCalendarEventsForMonth(
    encryptionKey: string,
    year: number,
    month: number
  ): Promise<Map<string, CalendarDayEvents>> {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const [tasks, transactions] = await Promise.all([
      this.getTasksForMonth(encryptionKey, year, month),
      this.getTransactions(encryptionKey, { dateRange: 'all' }),
    ]);

    const monthTransactions = transactions.filter((t) => t.date && t.date.startsWith(monthPrefix));
    const map = new Map<string, CalendarDayEvents>();

    // Process tasks
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const existing = map.get(t.due_date) || {
        date: t.due_date,
        tasks: [],
        transactions: [],
        hasIncome: false,
        hasExpense: false,
        highestPriority: undefined,
      };
      existing.tasks.push(t);
      if (
        !existing.highestPriority ||
        t.priority === 'high' ||
        (t.priority === 'medium' && existing.highestPriority === 'low')
      ) {
        existing.highestPriority = t.priority;
      }
      map.set(t.due_date, existing);
    });

    // Process transactions
    monthTransactions.forEach((tx) => {
      if (!tx.date) return;
      const existing = map.get(tx.date) || {
        date: tx.date,
        tasks: [],
        transactions: [],
        hasIncome: false,
        hasExpense: false,
        highestPriority: undefined,
      };
      existing.transactions.push(tx);
      if (tx.type === 'income') existing.hasIncome = true;
      if (tx.type === 'expense') existing.hasExpense = true;
      map.set(tx.date, existing);
    });

    return map;
  }

  async getDayAgenda(
    encryptionKey: string,
    date: string
  ): Promise<{ tasks: Task[]; transactions: Transaction[] }> {
    const db = await this.getDB();

    const [taskRows, txList] = await Promise.all([
      db.getAllAsync<any>('SELECT * FROM tasks WHERE due_date = ? ORDER BY priority DESC;', [date]),
      this.getTransactions(encryptionKey, { dateRange: 'all' }),
    ]);

    const tasks: Task[] = taskRows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description ? CryptoService.decryptData(r.description, encryptionKey) : null,
      status: r.status,
      priority: r.priority,
      due_date: r.due_date,
      completed_at: r.completed_at,
      tags: r.tags ? JSON.parse(r.tags) : [],
      created_at: r.created_at,
    }));

    const transactions = txList.filter((t) => t.date === date);

    return { tasks, transactions };
  }

  // ==========================================
  // PHASE 8: SETTINGS & AUDIT LOGS
  // ==========================================
  async getSetting(key: string): Promise<string | null> {
    const db = await this.getDB();
    const row = await db.getFirstAsync<any>('SELECT value FROM app_settings WHERE key = ?;', [key]);
    return row ? row.value : null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value;',
      [key, value]
    );
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>('SELECT key, value FROM app_settings;');
    const result: Record<string, string> = {};
    rows.forEach((r) => {
      result[r.key] = r.value;
    });
    return result;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?;',
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      timestamp: r.timestamp,
    }));
  }

  async clearAuditLogs(): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM audit_logs;');
    await this.addAuditLog('AUDIT_LOGS_CLEARED');
  }

  // ==========================================
  // PHASE 8: DATABASE RE-ENCRYPTION
  // ==========================================
  async reEncryptEntireDatabase(oldMasterKey: string, newMasterKey: string): Promise<void> {
    const db = await this.getDB();

    // 1. Re-encrypt vault_items
    const vaultRows = await db.getAllAsync<any>('SELECT * FROM vault_items;');
    for (const v of vaultRows) {
      const decUser = v.username ? CryptoService.decryptData(v.username, oldMasterKey) : null;
      const decPass = v.password ? CryptoService.decryptData(v.password, oldMasterKey) : '';
      const decNotes = v.notes ? CryptoService.decryptData(v.notes, oldMasterKey) : null;

      const encUser = decUser ? CryptoService.encryptData(decUser, newMasterKey) : null;
      const encPass = decPass ? CryptoService.encryptData(decPass, newMasterKey) : '';
      const encNotes = decNotes ? CryptoService.encryptData(decNotes, newMasterKey) : null;

      await db.runAsync(
        'UPDATE vault_items SET username = ?, password = ?, notes = ? WHERE id = ?;',
        [encUser, encPass, encNotes, v.id]
      );
    }

    // 2. Re-encrypt notes
    const noteRows = await db.getAllAsync<any>('SELECT * FROM notes;');
    for (const n of noteRows) {
      const decContent = n.content ? CryptoService.decryptData(n.content, oldMasterKey) : '';
      const encContent = CryptoService.encryptData(decContent, newMasterKey);

      await db.runAsync('UPDATE notes SET content = ? WHERE id = ?;', [encContent, n.id]);
    }

    // 3. Re-encrypt tasks
    const taskRows = await db.getAllAsync<any>('SELECT * FROM tasks;');
    for (const t of taskRows) {
      const decDesc = t.description ? CryptoService.decryptData(t.description, oldMasterKey) : null;
      const encDesc = decDesc ? CryptoService.encryptData(decDesc, newMasterKey) : null;

      await db.runAsync('UPDATE tasks SET description = ? WHERE id = ?;', [encDesc, t.id]);
    }

    await this.addAuditLog('DATABASE_RE_ENCRYPTED_WITH_NEW_MASTER_KEY');
  }

  // ==========================================
  // PHASE 8: BACKUP EXPORT & RESTORE
  // ==========================================
  async exportDatabaseData(): Promise<any> {
    const db = await this.getDB();
    const [vault_items, transactions, categories, notes, tasks, folders, app_settings, audit_logs] =
      await Promise.all([
        db.getAllAsync('SELECT * FROM vault_items;'),
        db.getAllAsync('SELECT * FROM transactions;'),
        db.getAllAsync('SELECT * FROM categories;'),
        db.getAllAsync('SELECT * FROM notes;'),
        db.getAllAsync('SELECT * FROM tasks;'),
        db.getAllAsync('SELECT * FROM folders;'),
        db.getAllAsync('SELECT * FROM app_settings;'),
        db.getAllAsync('SELECT * FROM audit_logs;'),
      ]);

    return {
      vault_items,
      transactions,
      categories,
      notes,
      tasks,
      folders,
      app_settings,
      audit_logs,
    };
  }

  async restoreDatabaseData(backupPayload: any): Promise<void> {
    const db = await this.getDB();

    await db.withTransactionAsync(async () => {
      // Clear existing records
      await db.execAsync(`
        DELETE FROM vault_items;
        DELETE FROM transactions;
        DELETE FROM categories;
        DELETE FROM notes;
        DELETE FROM tasks;
        DELETE FROM folders;
        DELETE FROM app_settings;
        DELETE FROM audit_logs;
      `);

      // Restore vault_items
      if (Array.isArray(backupPayload.vault_items)) {
        for (const item of backupPayload.vault_items) {
          await db.runAsync(
            `INSERT INTO vault_items (id, folder_id, title, username, password, url, notes, is_favorite, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              item.id,
              item.folder_id,
              item.title,
              item.username,
              item.password,
              item.url,
              item.notes,
              item.is_favorite,
              item.tags,
              item.created_at,
              item.updated_at,
            ]
          );
        }
      }

      // Restore categories
      if (Array.isArray(backupPayload.categories)) {
        for (const cat of backupPayload.categories) {
          await db.runAsync(
            `INSERT INTO categories (id, name, type, icon, color, monthly_budget)
             VALUES (?, ?, ?, ?, ?, ?);`,
            [cat.id, cat.name, cat.type, cat.icon, cat.color, cat.monthly_budget]
          );
        }
      }

      // Restore transactions
      if (Array.isArray(backupPayload.transactions)) {
        for (const tx of backupPayload.transactions) {
          await db.runAsync(
            `INSERT INTO transactions (id, category_id, type, amount, currency, date, payee_or_source, note, is_recurring, recurring_frequency, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              tx.id,
              tx.category_id,
              tx.type,
              tx.amount,
              tx.currency,
              tx.date,
              tx.payee_or_source,
              tx.note,
              tx.is_recurring,
              tx.recurring_frequency,
              tx.created_at,
            ]
          );
        }
      }

      // Restore notes
      if (Array.isArray(backupPayload.notes)) {
        for (const n of backupPayload.notes) {
          await db.runAsync(
            `INSERT INTO notes (id, folder_id, title, content, is_pinned, is_favorite, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              n.id,
              n.folder_id,
              n.title,
              n.content,
              n.is_pinned,
              n.is_favorite,
              n.tags,
              n.created_at,
              n.updated_at,
            ]
          );
        }
      }

      // Restore tasks
      if (Array.isArray(backupPayload.tasks)) {
        for (const t of backupPayload.tasks) {
          await db.runAsync(
            `INSERT INTO tasks (id, title, description, status, priority, due_date, completed_at, tags, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              t.id,
              t.title,
              t.description,
              t.status,
              t.priority,
              t.due_date,
              t.completed_at,
              t.tags,
              t.created_at,
            ]
          );
        }
      }

      // Restore folders
      if (Array.isArray(backupPayload.folders)) {
        for (const f of backupPayload.folders) {
          await db.runAsync(
            `INSERT INTO folders (id, name, type, color, icon) VALUES (?, ?, ?, ?, ?);`,
            [f.id, f.name, f.type, f.color, f.icon]
          );
        }
      }

      // Restore app_settings
      if (Array.isArray(backupPayload.app_settings)) {
        for (const s of backupPayload.app_settings) {
          await db.runAsync(
            `INSERT INTO app_settings (key, value) VALUES (?, ?);`,
            [s.key, s.value]
          );
        }
      }

      // Restore audit_logs
      if (Array.isArray(backupPayload.audit_logs)) {
        for (const a of backupPayload.audit_logs) {
          await db.runAsync(
            `INSERT INTO audit_logs (id, action, entity_type, entity_id, timestamp) VALUES (?, ?, ?, ?, ?);`,
            [a.id, a.action, a.entity_type, a.entity_id, a.timestamp]
          );
        }
      }
    });

    await this.addAuditLog('DATABASE_RESTORED_FROM_BACKUP');
  }

  // Reset / Wipe entire database
  async wipeDatabase(): Promise<void> {
    const db = await this.getDB();
    await db.execAsync(`
      DELETE FROM vault_items;
      DELETE FROM transactions;
      DELETE FROM notes;
      DELETE FROM tasks;
      DELETE FROM audit_logs;
      DELETE FROM app_settings;
    `);
    await this.addAuditLog('WIPE_VAULT_DATABASE');
  }
}

export const dbService = new DatabaseService();

/**
 * Top-level audit logger helper
 */
export async function logAuditEvent(action: string, entityType?: string | null, entityId?: string | null): Promise<void> {
  return await dbService.addAuditLog(action, entityType, entityId);
}
