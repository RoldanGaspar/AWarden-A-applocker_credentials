# 📌 ROLDAN'S PROMPT TEMPLATE PARA SA NEXT AI

> **Paano gamitin:**
> Sa bawat pag-umpisa mo ng bagong conversation o pag-open ng repo na ito sa bagong AI (Claude, Antigravity, ChatGPT, Cursor, etc.), kopyahin at i-paste mo lang ang prompt sa ibaba!

---

```markdown
Kumusta! Ang codebase na ito ay "AWarden - Life OS & Vault".
Bago ka magbasa o gumawa ng kahit anong code o suggestion, paki-basa at sundin ang mga sumusunod na guidelines sa repository na ito:

1. Basahin mo muna nang buo ang `AGENTS.md` at `SETUP_GUIDE.md` para maunawaan ang buong architecture, tech stack, at security rules.
2. Sundin ang mga mahahalagang alituntunin:
   - ZERO-CLOUD & 100% LOCAL-FIRST: Huwag maglalagay ng cloud sync, external analytics, telemetry, o remote APIs (walang Firebase, Supabase, atbp). Lahat ay naka-save sa local SQLite (`awarden.db`) at `expo-secure-store`.
   - SECURITY INTEGRITY: PBKDF2-HMAC-SHA256 (150k iterations) para sa key derivation, at AES-256-CBC para sa envelope encryption. Huwag i-bypass o tanggalin ang AuthGate at encryption layers.
   - TECH STACK: Expo 54 (React Native 0.81, React 19, Expo Router v6). Huwag mag-install ng magkakaibang UI libraries tulad ng NativeBase o Tailwind; gamitin ang aming existing Tamagui + custom UI components sa `src/components/ui/` at `src/theme/tokens.ts`.
   - INTEGRITY CHECKS: Bago matapos ang anumang task o code changes, siguraduhing papasa ang `npx tsc --noEmit` at `npm test`.

Ngayon, handa na tayong magpatuloy. Sabihin mo sa akin kapag nabasa mo na ang AGENTS.md at ano ang kasalukuyang status ng repository.
```

---

## 💡 Quick Tips kapag nag-migrate ka sa Bagong Laptop:

1. **Mag-clone galing sa GitHub:**
   ```bash
   git clone https://github.com/RoldanGaspar/AWarden-A-applocker_credentials.git
   cd AWarden-A-applocker_credentials
   ```
2. **Mag-install ng dependencies:**
   ```bash
   npm install
   ```
3. **Subukan ang health checks:**
   ```bash
   npx tsc --noEmit
   npm test
   ```
4. **I-run ang Expo:**
   ```bash
   npm start
   ```
5. I-paste ang prompt sa itaas sa bago mong AI assistant para sigurado kang hindi ito mag-ha-hallucinate o sisira ng codebase mo.
