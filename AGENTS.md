# AGENTS & SYSTEM ARCHITECTURE MANUAL (ANTI-HALLUCINATION RULES)

> **MANDATORY INSTRUCTIONS FOR ANY AI ASSISTANT WORKING ON THIS PROJECT:**
> Before proposing any architectural refactor, adding packages, or writing code, read and obey every rule defined in this document. Any response violating these principles will cause severe data corruption, security regression, or build breakage.

---

## 🛑 STRICT RULES (DO NOT BREAK)

### 1. Zero Cloud / 100% Local-First
- **NEVER** introduce external analytics, remote APIs, cloud sync, telemetry, or server-dependent dependencies (e.g., Firebase, Supabase, Google Analytics, Sentry).
- All data, transactions, vault secrets, notes, and preferences **must stay strictly on the client** in SQLite (`awarden.db`) and `expo-secure-store`.

### 2. Cryptography & Security Integrity
- **Algorithm Rules**:
  - Key derivation: **PBKDF2-HMAC-SHA256** (150,000 iterations + 16-byte random salt).
  - Field encryption: **AES-256-CBC** with unique per-entry initialization vectors (IV).
  - Backups: `.vault` files encrypted with AES-256-CBC.
- **Envelope Encryption**:
  - Sensitive columns (passwords, usernames, note bodies, task descriptions) are encrypted *before* being written to SQLite.
  - The SQLite database itself never stores plaintext passwords.
- **Memory Safety**:
  - Master key is kept in memory only when unlocked (`AuthContext`).
  - Never log plaintext secrets to console or debug logs.
  - Clipboard is automatically cleared after 30 seconds.

### 3. Framework & Package Compatibility
- **Expo SDK Version**: **Expo 54** (`expo: ~54.0.0`) with **React 19** (`react: 19.1.0`) and **React Native 0.81** (`react-native: 0.81.5`).
- **Expo Router**: Version 6 (`expo-router: ~6.0.24`). Uses directory structure `app/(tabs)/...`.
- **UI & Styling**:
  - Uses a cohesive hybrid design system: **Tamagui (`tamagui: ^2.7.7`)** + Custom themed primitives in `src/components/ui/` + `src/theme/tokens.ts`.
  - Iconography: Exclusively `lucide-react-native`.
  - Animations: `react-native-reanimated` (~4.1.1) and custom motion utilities in `src/theme/motion.ts`.
  - Do **NOT** install NativeBase, Tailwind/Nativewind, or Paper. Maintain the existing tokenized design system.

### 4. Database Schema Integrity
- Database singleton is in `src/services/db.ts`.
- Uses `expo-sqlite` (new async API with SQLite WAL mode enabled).
- **Existing Tables**:
  - `credentials`: Password vault entries (encrypted fields: `username`, `password`, `notes`, `totp_secret`).
  - `transactions`: Ledger cash entries (`amount`, `category`, `type`, `date`, `note`, `currency`, `is_recurring`, `frequency`).
  - `categories`: Ledger budget categories with monthly budget limits.
  - `notes`: Markdown documents (encrypted field: `content`, `folder_id`, `tags`, `is_pinned`).
  - `tasks`: Kanban/Calendar tasks (`title`, `description` [encrypted], `status`, `priority`, `due_date`, `completed_at`).
  - `folders`: Folder organization (`type` = 'vault' | 'notes').
  - `activity_logs`: Last 100 system audit trail logs.
- When altering schema, always ensure backwards compatibility with automated migration checks.

---

## 📂 DIRECTORY STRUCTURE & FILE RESPONSIBILITIES

```
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom Navigation Bar (Dashboard, Vault, Ledger, Notes, Tasks, Settings)
│   │   ├── index.tsx        # Dashboard Screen route
│   │   ├── vault.tsx        # Vault Screen route
│   │   ├── ledger.tsx       # Ledger Screen route
│   │   ├── notes.tsx        # Notes Screen route
│   │   ├── tasks.tsx        # Tasks & Calendar Screen route
│   │   └── settings.tsx     # Settings Screen route
│   ├── _layout.tsx          # Root Stack layout, AuthGate provider wrap
│   └── modal.tsx            # Global modal route
├── src/
│   ├── components/
│   │   ├── AuthGate.tsx     # Guards app when locked, displays LockScreen/SetupScreen
│   │   ├── dashboard/       # KPI widgets, QuickActionsModal
│   │   ├── ledger/          # Transaction rows, budget cards, SVG charts, VirtualAccountCard
│   │   ├── notes/           # Markdown editor, preview mode, note cards
│   │   ├── search/          # GlobalSearchModal (cross-module search across all 5 modules)
│   │   ├── tasks/           # Kanban swimlanes, month calendar, task cards
│   │   ├── ui/              # Button, Card, Input, Modal, FAB, NeomorphicSurface, AnimatedPressable, OwlMascot, etc.
│   │   └── vault/           # CredentialCard, Password generator modal, security auditor
│   ├── context/
│   │   └── AuthContext.tsx  # Master password lifecycle, auto-lock listener, biometric auth
│   ├── services/
│   │   ├── cryptoService.ts # PBKDF2 derivation, AES-256-CBC, recovery code generator
│   │   ├── secureStorage.ts # expo-secure-store hardware wrapper
│   │   ├── db.ts            # SQLite database initialization & CRUD methods
│   │   └── backupService.ts # .vault encrypted backup builder & parser, CSV exporter
│   └── theme/
│       ├── tokens.ts        # WCAG AA palettes (Sage, Clay, Slate, Moss, Dusk, Obsidian)
│       ├── motion.ts        # Reanimated spring & timing configurations
│       └── ThemeContext.tsx # Dynamic theme switching and scaling
```

---

## 🧪 VERIFICATION PROTOCOL (REQUIRED BEFORE COMMITTING)

Every AI must run these commands to ensure no build or runtime regressions:
```bash
# 1. Typecheck: Must pass with 0 errors
npx tsc --noEmit

# 2. Automated Tests: Must pass all tests
npm test
```
