# WalleTrack ✅

A cross-platform personal finance app built with **Expo SDK 57** (React Native + TypeScript), styled with **NativeWind** (Tailwind CSS), powered by **Appwrite** as the single backend, and state-managed with **Zustand**.

Designed to be a complete, Play-Store-ready personal money manager: dark balance cards, native-style charts, budgets, insights, biometric lock, offline queue, and EN/HI internationalization.

> **Note (read first):** MMKV 4.x uses Nitro Modules, so this app requires an **Expo development build** (it will **not** run in Expo Go). See [`setup.md`](setup.md).

---

## Features

- 🔐 Email/password + Google OAuth auth (Appwrite) [will be added later]
- 💳 Multiple accounts (cash / bank / card)
- ➕ Add income, expense, and transfer transactions (with splits, receipts, recurring)
- 📊 Dashboard with live balance card, weekly summary, and charts (react-native-gifted-charts)
- 🧾 Category-based expense breakdown & monthly analytics
- 🎯 Budgets with progress bars and overspend alerts
- 💡 Financial insights (savings rate, avg daily spend, top category)
- 👨‍👩‍👧 Family groups / shared tracking
- 🌗 Full dark + light mode (persisted, system-aware)
- 🔢 Biometric (Face ID / fingerprint) app lock
- 📡 Offline support with a sync queue
- 🌐 i18n: English + Hindi
- 👑 Premium upsell screen

---

## Tech Stack

| Area        | Choice                                                        |
| ----------- | ------------------------------------------------------------- |
| Framework   | Expo SDK 57, React Native 0.86, React 19, TypeScript          |
| Styling     | NativeWind 4.2.6 + Tailwind CSS 3.4.19                        |
| Navigation  | React Navigation (native stack + bottom tabs, custom tab bar) |
| State       | Zustand                                                       |
| Storage     | react-native-mmkv 4.3.2 (Nitro, dev-build only)               |
| Backend     | Appwrite (react-native-appwrite 0.34.0)                       |
| Charts      | react-native-gifted-charts                                    |
| Animation   | Reanimated 4.5.1 + Moti                                       |
| Toasts      | react-native-toast-alert                                      |
| Fonts       | Poppins (@expo-google-fonts/poppins)                          |

---

## Getting Started

```bash
npm install          # use: npm install --cache /tmp/npm-cache if your npm cache is broken
npx expo start       # requires a development build (not Expo Go)
```

Then configure your Appwrite backend and fill in `.env` (see [`setup.md`](setup.md)).

- `npm run start` – start Metro
- `npm run android` – run on Android emulator/device (dev build)
- `npm run ios` – run on iOS simulator/device (dev build)

---

## Project Structure

```
WalleTrack/
├── App.tsx                    # Root: fonts, gesture-handler, SafeArea, ToastManager
├── index.ts                   # Entry (gesture-handler + url-polyfill first)
├── app.json                   # Expo config (ids, permissions, plugins)
├── tailwind.config.js         # Brand colors, dark: variant, shadows
├── babel.config.js            # Presets + module-resolver aliases
├── metro.config.js            # NativeWind CSS support
├── global.css                 # Tailwind entry
├── .env / .env.example        # Appwrite credentials (placeholders)
└── src/
    ├── components/            # UI + business components (Button, Input, BalanceCard…)
    ├── constants/             # Colors, icons, presets
    ├── i18n/                  # EN + HI localization
    ├── navigation/            # Root/Auth/Main/Setup navigators + types
    ├── screens/               # onboarding, auth, setup, main, accounts, transactions,
    │                          # analytics, budgets, insights, settings
    ├── services/              # appwrite, offline, exchange, notifications, crypto, storage
    ├── stores/                # Zustand stores
    ├── theme/                 # Theme config
    ├── types/                 # Shared TypeScript types
    └── utils/                 # cn, format, helpers, toast
```

---

## Scripts & Validation

```bash
npx tsc --noEmit              # type-check (project currently passes with 0 errors)
npx expo export --platform ios   # verifies Metro bundle
npx expo prebuild             # generate native ios/android (dev build prerequisite)
```

---

## Publishing / Releasing

> The app ships as a **native (dev-build) Expo app** (MMKV 4.x / Nitro), so releases go through **EAS Build** — never Expo Go. `app.json` already has the ids: package/bundle `com.walletrack.app`, slug `walle-track`.

### 0. Prerequisites (once)

1. Create accounts: **Apple Developer** ($99/yr) + App Store Connect, and **Google Play Console** ($25 one-time, `com.walletrack.app`).
2. Add the app platforms in **Appwrite → Project Settings → Platforms**:
   - **Android:** package `com.walletrack.app` + your signing keystore **SHA-1** (needed for Google OAuth to work in production).
   - **iOS:** bundle `com.walletrack.app`.
3. Install the EAS CLI and log in:

```bash
npm install -g eas-cli
eas login
```

4. Generate the EAS build config:

```bash
eas build:configure
```

5. Set the release version in `app.json` (bump these each release):

```json
"android": { "package": "com.walletrack.app", "versionCode": 1 },
"ios": { "bundleIdentifier": "com.walletrack.app", "buildNumber": "1" }
```

6. Create the signing credentials (one-time, keep forever — EAS manages the keystore/certs):

```bash
eas credentials
```

### A. Publish to Google Play Store

1. Build a signed release **AAB** (Play requires `.aab`):

```bash
eas build --platform android --profile production
```

2. Upload it and finish the store listing:

```bash
eas submit --platform android
```

3. In **Play Console** (play.google.com/apps/publish): create the app → open the uploaded release → complete the **Data safety** form, **Content rating** questionnaire, and **App content** (privacy policy URL) → choose target countries → roll out.

### B. Live on Google Drive (sideload APK)

For public sharing without the store (or beta testing), build an installable **APK** instead of an AAB. Add a `preview` profile to `eas.json`:

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "production": { "autoIncrement": true },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } }
  }
}
```

Then:

```bash
eas build --platform android --profile preview        # produces a signed .apk
eas submit --platform android                         # if you want to TestFlight-style internal testing
```

Upload the generated `.apk` to **Google Drive**, set the share link to **"Anyone with the link → Viewer"**, and send the link. Installers must enable **Install unknown apps** on their device (Settings → Apps → Special app access). Note: the app was signed with your keystore, so reinstall/updates over this build work, but Appwrite Google OAuth only works if that keystore's SHA-1 is registered (step 0).

### C. Publish to Apple App Store

```bash
eas build --platform ios --profile production         # archive
eas submit --platform ios                             # uploads to App Store Connect
```

In **App Store Connect**: create the app record → fill **App Privacy** answers + privacy policy URL + screenshots → TestFlight review → submit to **App Review**.

### Post-release checks

- Dark-mode QA on every screen.
- Biometric lock on a physical device.
- Offline queue syncs once network returns.
- New UI text added to **both** `en.ts` and `hi.ts`.

---

## License

MIT — see [`LICENSE`](LICENSE).

See [`design.md`](design.md) for the design system, [`skill.md`](skill.md) for the build skill, and [`setup.md`](setup.md) for full backend + release setup.
