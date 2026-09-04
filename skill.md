# WalleTrack — Skill / Build Reference

Concise playbook for building and extending WalleTrack. Kept short on purpose — this is a reference for a coding agent working on the project.

## Golden Rules

1. **Expo SDK 57** — before writing any RN/Expo code, read the versioned docs: `https://docs.expo.dev/versions/v57.0.0/`.
2. **Appwrite is the ONLY backend.** No Firebase, no Supabase, no REST server. Everything goes through `src/services/appwrite/*`.
3. **NativeWind dark:` variant** is the source of truth for theming. Colors come from `tailwind.config.js` + `useThemeStore`.
4. **Path aliases** (babel + tsconfig): `@components`, `@screens`, `@stores`, `@services`, `@constants`, `@theme`, `@utils`, `@navigation`, `@i18n`, `@t` (types).
5. **Never import bare runtime types via `@types/*`** — that alias collides with TypeScript's `@types` concept. Use `@t/*`.
6. **MMKV 4.x (Nitro)** — use `createMMKV()`, **not** `new MMKV()`. And `remove()` not `delete()`. Requires a dev build; no Expo Go.
7. **npm cache is broken** on this machine — always `npm install --cache /tmp/npm-cache`.
8. **No comments in code** unless the user asks.
9. Don't commit unless explicitly asked.

## Build Order (10 phases)

1. Expo project + deps + config (tailwind/babel/metro/app.json/.env)
2. Auth (Appwrite email + Google OAuth)
3. Onboarding + profile setup (nationality/currency/language/avatar)
4. Core CRUD services (accounts, categories)
5. Transactions (income/expense/transfer, splits, recurring, receipts)
6. Dashboard (balance card, charts, recent txs)
7. Budgets + progress + alerts
8. Biometrics + offline queue + notifications
9. Settings + premium + family
10. Polish (charts, dark-mode QA, empty states, docs)

## Conventions & Patterns

- **Stores (Zustand):** each `useXStore` holds local state + `loadX(userId)` (reads) and action methods (writes). Offline writes enqueue to MMKV; on sync they hit Appwrite. See `src/stores/*`.
- **Formatting:** always route currency/number formatting through `@utils/format` (`formatCurrency`, `formatDate`) so locale/base currency stay consistent.
- **Theme:** `useThemeStore((s) => s.isDark)` for dark-mode-aware styling. Use `cn(...)` to branch light/dark classes.
- **i18n:** keys live in `src/i18n/locales/{en,hi}.ts`, accessed via `i18n.t("...")`. Add keys to **both** locales.
- **Icons:** use `lucide-react-native`. Category icons map via `CategoryIcon` in `src/components/common/CategoryListItem.tsx`.
- **Toasts:** `import { toast } from "@utils/toast"` → `toast.success/error/info/warning`.

## Tooling

- Type-check: `npx tsc --noEmit`
- Bundle check: `npx expo export --platform ios|android`
- Fonts: `@expo-google-fonts/poppins` via `useFonts` in `App.tsx`. Font files live in weight subfolders (e.g. `400Regular/Poppins_400Regular.ttf`).
- Toast mount: render `<ToastManager />` once at the root (above or beside the navigator).

## Known Trade-offs

- Client-side **full account deletion is not possible** via Appwrite web SDK — we do `account.deleteSession("current")` + clear local caches. True deletion needs the server-side Users API.
- MMKV 4.x requires `expo prebuild` / EAS dev build; it is not Expo-Go-compatible.
- `.env` Appwrite IDs are placeholders until the user runs the setup steps.
