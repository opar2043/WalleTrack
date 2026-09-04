# WalleTrack — Project Checklist

> Cross-platform personal finance app (Expo SDK 57 + NativeWind + Appwrite + Zustand).
> Update this file as phases complete. Mark `[x]` done, `[ ]` pending.

## Completed
- [x] Initialize Expo TS project (SDK 57, RN 0.86, React 19)
- [x] Install all base dependencies (fonts, nav, charts, mmkv, appwrite, etc.)
- [x] Base config: `tailwind.config.js`, `babel.config.js`, `metro.config.js`, `global.css`, `tsconfig.json`, `app.json`, `.env`, `.env.example`
- [x] Services layer
  - [x] `storage.ts` (MMKV 4.x via `createMMKV`)
  - [x] Appwrite: `client`, `auth`, `profiles`, `accounts`, `categories`, `transactions`, `budgets`, `recurringRules`, `familyGroups`
  - [x] Exchange rates, notifications, offline network + queue, biometric crypto
- [x] Stores (Zustand): auth, profile, accounts, categories, transactions, budgets, theme
- [x] Utils: format, helpers, cn, toast
- [x] Types (`src/types/index.ts`), theme config, constants, languages
- [x] i18n EN + HI
- [x] UI components: Button, Input, Screen, Card, Avatar, LoadingState, EmptyState, Header
- [x] Business components: BalanceCard, CalendarStrip, TransactionListItem, CategoryIcon/CategoryListItem, CustomTabBar
- [x] Navigation: Root/Auth/Main/Setup navigators + types
- [x] Screens
  - [x] Onboarding
  - [x] Auth: Login, Signup, ForgotPassword
  - [x] Setup: ProfileSetup
  - [x] Main: Home (dashboard)
  - [x] Accounts
  - [x] AddTransaction (cleaned up)
  - [x] Reports (analytics)
  - [x] AnalyticsDetail
  - [x] Budgets
  - [x] Insights
  - [x] Filters
  - [x] TransactionDetail
  - [x] Settings
  - [x] ProfileEdit
  - [x] CategoryManagement
  - [x] Premium
  - [x] Family
- [x] Root App.tsx (fonts, gesture-handler, SafeAreaProvider, ToastManager) + index.ts
- [x] TypeScript compiles clean (`npx tsc --noEmit` → 0 errors)
- [x] Metro bundling verified: iOS (4035 modules) + Android (4031 modules) build successfully
- [x] Fixed MMKV 4.x Nitro API (`createMMKV`), client.ts `@env` collection IDs, appwrite OAuth/delete
- [x] Wrote docs: `readme.md`, `skill.md`, `design.md`, `setup.md`, `PROJECT_TODO.md`

## Remaining (quality / release)
- [ ] Dark mode QA pass across all screens
- [ ] Charts polish (replace weekly bars with react-native-gifted-charts on dashboard)
- [ ] Empty-state + FAB flow polish
- [ ] i18n key coverage audit (make sure no placeholders/TODO strings)
- [ ] Real app icon/splash/adaptive-icon assets (currently Expo defaults)
- [ ] Play Store release: EAS build, keystore, Play Console upload
- [ ] (User action) Configure Appwrite backend + replace `.env` placeholder IDs

## Hard/Blocked / Notes
- MMKV 4.x uses Nitro Modules → requires a development build; NOT compatible with Expo Go.
- Appwrite SDK IDs are placeholders in `.env`; user must configure real project + replace IDs.
- `react-native-toast-alert` ToastManager mounts with no props (componentId unused).
- Client-side full account deletion not possible; only session deletion + local clear.
