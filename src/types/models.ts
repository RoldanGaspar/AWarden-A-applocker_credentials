/**
 * Life OS & Vault - Data Models & TypeScript Interfaces
 * Shared schema types across database, services, and UI layers
 */

export interface VaultItem {
  id: string;
  folder_id: string | null;
  title: string;
  username: string; // Decrypted plaintext when in-memory
  password: string; // Decrypted plaintext when in-memory
  url: string | null;
  notes: string | null; // Decrypted plaintext when in-memory
  tags: string[]; // Parsed from JSON string
  is_favorite: boolean;
  created_at: number;
  updated_at: number;
}

export interface VaultFilterOptions {
  search?: string;
  folderId?: string | null;
  tag?: string | null;
  onlyFavorites?: boolean;
  sortBy?: 'updated_at' | 'title' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export interface PasswordHealthIssue {
  itemId: string;
  title: string;
  username: string;
  issueType: 'weak' | 'duplicate';
  reason: string;
}

export interface PasswordHealthReport {
  totalCount: number;
  weakCount: number;
  duplicateCount: number;
  healthScore: number; // 0 to 100
  issues: PasswordHealthIssue[];
}

export type TransactionType = 'income' | 'expense';

export type CurrencyCode = 'PHP' | 'USD' | 'AUD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'SGD';

export const CURRENCIES: { code: CurrencyCode; symbol: string; label: string }[] = [
  { code: 'PHP', symbol: '₱', label: 'PHP (₱) Philippine Peso' },
  { code: 'USD', symbol: '$', label: 'USD ($) US Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) Australian Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) British Pound' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) Japanese Yen' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$) Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) Singapore Dollar' },
];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category_id: string;
  date: string; // ISO date string: YYYY-MM-DD
  payee_or_source: string | null;
  note: string | null; // Decrypted plaintext when in-memory
  is_recurring: boolean;
  recurring_frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  created_at: number;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
}

export type TransactionItem = Transaction;

export interface TransactionFilterOptions {
  type?: 'all' | 'income' | 'expense';
  categoryId?: string | null;
  dateRange?: 'this_month' | 'last_month' | 'this_year' | 'all';
  search?: string;
  isRecurring?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  monthly_budget_limit: number | null;
}

export type CategoryItem = Category;

export interface BudgetOverviewItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  limit: number;
  spent: number;
  percentage: number;
  status: 'safe' | 'warning' | 'over'; // safe <80%, warning 80-100%, over >100%
}

export interface CategorySpendingItem {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  totalAmount: number;
  percentage: number;
}

export interface MonthlySeriesItem {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. "Aug 2026" or "Aug"
  income: number;
  expense: number;
  net: number;
}

export interface Note {
  id: string;
  folder_id: string | null;
  title: string;
  content: string; // Decrypted plaintext when in-memory
  is_pinned: boolean;
  is_favorite: boolean;
  tags: string[];
  created_at: number;
  updated_at: number;
}

export type NoteItem = Note;

export interface NoteFilterOptions {
  search?: string;
  folderId?: string | null;
  tag?: string | null;
  onlyPinned?: boolean;
  onlyFavorites?: boolean;
  sortBy?: 'updated_at' | 'title' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export type TaskStatus = 'todo' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string | null; // Decrypted plaintext when in-memory
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null; // YYYY-MM-DD
  completed_at: number | null;
  tags: string[];
  created_at: number;
}

export type TaskItem = Task;

export interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  tag?: string | null;
  search?: string;
  dueRange?: 'overdue' | 'today' | 'upcoming' | 'all';
}

export interface CalendarDayEvents {
  date: string; // YYYY-MM-DD
  tasks: Task[];
  transactions: Transaction[];
  hasIncome: boolean;
  hasExpense: boolean;
  highestPriority?: TaskPriority;
}

export type FolderType = 'vault' | 'notes';

export interface Folder {
  id: string;
  name: string;
  type: FolderType;
  color: string;
  icon: string;
}

export type FolderItem = Folder;

export interface AppSetting {
  key: string;
  value: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  timestamp: number;
}

export type AuditLogItem = AuditLog;

export interface DashboardStats {
  netBalance: number;
  totalIncome: number;
  totalExpense: number;
  vaultCount: number;
  openTasksCount: number;
  notesCount: number;
  lastBackupTimestamp: number | null;
  userDisplayName: string;
}
