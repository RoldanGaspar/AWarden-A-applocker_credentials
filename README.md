# Life OS & Vault (Local-First Privacy Mobile Application)

A **zero-cloud, local-first, privacy-hardened personal Life OS** built with **Expo (React Native + TypeScript)**, featuring an encrypted password manager, multi-currency budget ledger, safe Markdown notes, interactive Kanban and calendar manager, AES-256 backup engine, and a security-hardened authentication gate.

---

## 🔒 Security Architecture & Cryptography

- **Zero-Cloud & Zero-Telemetry**: All database files, credentials, notes, transactions, and cryptographic keys reside 100% on the local device filesystem.
- **Key Derivation (PBKDF2-HMAC-SHA256)**: Master passwords derive a 256-bit encryption key using 150,000 iterations of SHA-256 with a unique 16-byte random salt.
- **Envelope Field Encryption (AES-256-CBC)**: Sensitive fields (passwords, usernames, secret notes, task descriptions) are encrypted using AES-256-CBC with a unique initialization vector (IV) per entry before being written to SQLite.
- **Secure Hardware Storage**: Password authentication verification hashes, salts, and biometric authorization keys are stored via `expo-secure-store` with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` keychain protection.
- **Biometric Unlock**: Uses `expo-local-authentication` (Face ID / Fingerprint) to safely release the in-memory master encryption key without storing the raw plaintext password.
- **Auto-Lock Engine**: AppState listener automatically locks the vault and purges in-memory keys when the application is backgrounded or inactive for a configurable timeout (Immediate, 1m, 5m, 15m).
- **Emergency Recovery Code**: Cryptographically generated 25-character single-use recovery code (`VAULT-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`) allowing secure master password reset.
- **Stand-Alone Encrypted Backups**: `.vault` backup files encrypted with AES-256-CBC using a separate backup password, exportable via native Share Sheet.

---

## 📱 Modules & Features

### 1. Dashboard & Quick Actions Hub
- Real-time KPI summary grid (Vault credentials, Monthly Net Cash Flow, Active Tasks, Pinned Notes).
- Backup Health status indicator with quick backup shortcut.
- Recent activity feed showing latest transactions, credentials, and tasks.
- Quick Actions modal enabling one-tap creation across all 5 modules.

### 2. Encrypted Password Vault
- Full-text search across credentials and folders.
- Password Health Auditor (detects weak, reused, and aged passwords with one-tap fixes).
- CSPRNG Password Generator with custom character sets (symbols, numbers, uppercase).
- Eye-toggle password reveal and 30-second clipboard auto-clear.
- Folder organization (with safe unlinking).

### 3. Multi-Currency Budget Ledger
- Multi-currency transaction logging (PHP ₱, USD $, EUR €, GBP £, JPY ¥, AUD, CAD, SGD).
- Category budget progress bars with safe, warning, and over-budget states.
- SVG Financial Insights: Donut category breakdown and 6-month historical income vs expense bar chart.
- Recurring transaction tracking (daily, weekly, monthly, yearly).

### 4. Safe Markdown Notes
- Full-featured Markdown Editor with live Write / Preview modes.
- 13-action formatting toolbar (Headings H1-H3, Bold, Italic, Strikethrough, Lists, Checklist, Code, Quotes, Links).
- Stripped Markdown plain-text card snippets with relative timestamps.
- Note folders (`type='notes'`) and multi-tag filtering.

### 5. Tasks & Unified Calendar
- Segmented toggle between **Board View** (Kanban To Do / In Progress / Completed) and **Calendar View** (Month Grid).
- Quick status progression buttons (start, complete, reopen).
- Unified Month Calendar aggregating task priority dots (Red/Amber/Green) and financial transaction dots (Green Income / Red Expense).
- Day Agenda modal with quick task injector.

### 6. System Settings & Privacy Controls
- Theme mode selector (Dark, Light, System) and 6 WCAG AA accent palettes (Sage, Clay, Slate, Moss, Dusk, Obsidian).
- Master password change with automated database re-encryption.
- Configurable Auto-Lock timeout and clipboard auto-clear toggle.
- Encrypted `.vault` backup creation & document picker restoration.
- CSV spreadsheet export for Transactions and Notes.
- Activity log audit trail (last 100 system events).
- Danger zone factory reset with typed confirmation.

---

## 📂 Project Structure

```
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Bottom tabs (Dashboard, Vault, Ledger, Notes, Tasks, Settings)
│   │   ├── index.tsx        # Dashboard Hub
│   │   ├── vault.tsx        # Encrypted Password Manager
│   │   ├── ledger.tsx       # Multi-Currency Budget Ledger
│   │   ├── notes.tsx        # Safe Markdown Notes
│   │   ├── tasks.tsx        # Kanban Tasks & Unified Calendar
│   │   └── settings.tsx     # System Settings, Backups & Security
│   ├── _layout.tsx          # Root Stack & AuthGate Provider tree
│   └── modal.tsx            # Info & Quick Action modal
├── src/
│   ├── components/
│   │   ├── AuthGate.tsx     # Security Gate controller
│   │   ├── dashboard/       # Quick Actions Modal & Dashboard widgets
│   │   ├── vault/           # Password Vault cards, forms, modals & auditor
│   │   ├── ledger/          # Transactions, categories & SVG charts
│   │   ├── notes/           # Markdown Editor, toolbar & preview
│   │   ├── tasks/           # Kanban Swimlanes, Calendar & Day Agenda
│   │   ├── settings/        # Backups, CSV export, password change & danger zone
│   │   └── ui/              # Reusable UI component library (Buttons, Cards, Modals, etc.)
│   ├── context/
│   │   └── AuthContext.tsx  # Master key derivation, biometrics, auto-lock & re-encryption
│   ├── services/
│   │   ├── cryptoService.ts # PBKDF2, AES-256-CBC, CSPRNG generator & recovery codes
│   │   ├── secureStorage.ts # expo-secure-store hardware-backed keystore
│   │   ├── db.ts            # SQLite singleton with WAL mode and encrypted queries
│   │   └── backupService.ts # .vault file encryption/decryption & CSV export
│   └── theme/
│       ├── tokens.ts        # WCAG AA color palettes & typography tokens
│       └── ThemeContext.tsx # Dynamic theme & font scale provider
```

---

## 🧪 Testing & Verification

Run the full automated test suite:

```bash
npm test
```

Run TypeScript compilation check:

```bash
npx tsc --noEmit
```
