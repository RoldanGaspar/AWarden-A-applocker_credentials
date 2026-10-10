# SETUP & MIGRATION GUIDE: AWarden Life OS & Vault

This document is the definitive guide to cloning, setting up, and running **AWarden Life OS & Vault** on a fresh laptop/workstation.

---

## ⚙️ 1. Prerequisites

Make sure the following are installed on your new machine:

1. **Node.js**: LTS version (Node 20.x or 22.x recommended).
2. **Git**: Installed and configured with your GitHub credentials / SSH keys.
3. **Expo Go / Development Client**:
   - For physical device testing: Install **Expo Go** from Google Play Store or Apple App Store.
   - For Android Emulator: Install **Android Studio** + Android SDK & build-tools.
4. **Package Manager**: `npm` (bundled with Node.js).

---

## 🚀 2. Quick Setup Steps

### Step 1: Clone the Repository
```bash
git clone https://github.com/RoldanGaspar/AWarden-A-applocker_credentials.git
cd AWarden-A-applocker_credentials
```

### Step 2: Install Dependencies
```bash
npm install
```
> [!NOTE]
> All core dependencies (`expo@~54.0.0`, `react@19.1.0`, `react-native@0.81.5`, `tamagui@^2.7.7`, `expo-sqlite@~16.0.10`, `crypto-js`) are locked in `package-lock.json`. Avoid running `npm audit fix --force` or manual major version bumps unless instructed.

### Step 3: Run the Development Server
```bash
# Start Expo development bundler
npx expo start

# Or via npm script
npm start
```

### Step 4: Launching on Device / Emulator
- **Physical Phone (Expo Go)**:
  - Run `npm start`.
  - Scan the QR code shown in the terminal using the Expo Go app (Android) or Camera app (iOS).
  - *Tip for different network subnets*: Use tunnel mode: `npx expo start --tunnel`.
- **Web Preview**:
  - Run `npm run web` or press `w` in the Expo terminal.
- **Android Emulator**:
  - Open Android Studio emulator.
  - Press `a` in the Expo terminal or run `npm run android`.

---

## 🧪 3. Verification & Health Checks

Always verify that your environment passes both TypeScript checking and automated security tests:

1. **TypeScript Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   *(Must exit with 0 errors)*

2. **Automated Unit & Crypto Test Suite**:
   ```bash
   npm test
   ```
   *(Runs Jest unit tests verifying PBKDF2-HMAC-SHA256 derivation, AES-256-CBC envelope encryption, and backup export/import integrity)*

---

## 🛠️ 4. Key Troubleshooting & Gotchas

1. **Metro Cache Issues**:
   If you ever encounter weird bundling errors or missing modules:
   ```bash
   npx expo start -c
   ```
2. **Tamagui / Reanimated Babel or Metro Config**:
   - Configuration is in `metro.config.js` and `tamagui.config.ts`.
   - React Native Reanimated v4 is loaded. If animation worklets show errors, ensure cache is cleared with `-c`.
3. **Database Reset during Development**:
   - The app uses local SQLite (`awarden.db`) in WAL mode.
   - You can completely reset test data directly inside the app: **Settings Tab > Danger Zone > Reset Application**, or clear app storage in Expo Go.
