# WalleTrack — Setup Guide

How to configure the **Appwrite** backend, fill in credentials, run the app, and prepare a **Play Store** release.

> **Important:** MMKV 4.x (Nitro) means this app requires an **Expo development build** — it will **not** run in Expo Go. Follow the "Development build" step below.

---

## 1. Install & understand the cache workaround

```bash
# On this machine npm's default cache is broken. Always use a temp cache:
npm install --cache /tmp/npm-cache
```

---

## 2. Create the Appwrite backend

1. Create an account at [Appwrite Cloud](https://cloud.appwrite.io) → create a new **Project**.
2. Create a **Database** (`finance_db`) and note its **Database ID**.
3. Create **Collections** (all with `$id`, `$createdAt`, `$updatedAt` defaults):
   - `profiles`
   - `accounts`
   - `categories`
   - `transactions`
   - `recurring_rules`
   - `budgets`
   - `family_groups`
4. Create **Storage Buckets**:
   - `receipts` (permission: read all)
   - `avatars` (permission: read all)

> The app reads these IDs from the environment — you can use the short names above OR your own. Whatever you use, put the real values in `.env` (step 3).

---

## 3. Fill in `.env`

Copy `.env.example` → `.env` and replace the placeholder values:

```env
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=<your_project_id>

APPWRITE_DATABASE_ID=finance_db

APPWRITE_ACCOUNTS_COLLECTION_ID=accounts
APPWRITE_CATEGORIES_COLLECTION_ID=categories
APPWRITE_TRANSACTIONS_COLLECTION_ID=transactions
APPWRITE_RECURRING_RULES_COLLECTION_ID=recurring_rules
APPWRITE_BUDGETS_COLLECTION_ID=budgets
APPWRITE_PROFILES_COLLECTION_ID=profiles
APPWRITE_FAMILY_GROUPS_COLLECTION_ID=family_groups

APPWRITE_RECEIPTS_BUCKET_ID=receipts
APPWRITE_AVATARS_BUCKET_ID=avatars

# Optional, used for open.er-api.com fallback fetches
EXCHANGE_RATE_API_KEY=
```

**Credential file names (what to edit):**
- `.env` — real values (git-ignored)
- `.env.example` — template (committed)

The app reads these via `react-native-dotenv` (`@env`). See `src/services/appwrite/client.ts`.

### Platform config
Under Appwrite project **Settings → Platforms**, add:
- **Android:** package `com.walletrack.app` (fill your signing SHA-256 for Google sign-in).
- **iOS:** bundle `com.walletrack.app` (configure for Apple sign-in).

OAuth (Google) additionally needs your app's OAuth redirect URL configured on the Appwrite side.

---

## 4. Run the app

Because of MMKV/Nitro, do a **dev build** first:

```bash
# generate native projects
npx expo prebuild

# run a dev build
npx expo run:ios      # or npx expo run:android
```

For OTA/dev iteration you can keep using a dev client build. You can verify the JS bundles without native:

```bash
npx tsc --noEmit
npx expo export --platform ios
npx expo export --platform android
```

---

## 5. Play Store release (EAS)

1. Install EAS CLI: `npm install -g eas-cli` and log in (`eas login`).
2. Set the app identity (already in `app.json`):
   - package: `com.walletrack.app`
   - slug: `walle-track`
3. Configure build:
   ```bash
   eas build:configure
   ```
4. Create a release build (Play requires a signed AAB):
   ```bash
   eas build --platform android --profile production
   ```
   (The generated AAB will be in the EAS build or you can produce one via `expo prebuild` + Gradle.)

5. Generate/upload a keystore (EAS will prompt and manage it).
6. In Play Console: create app → upload the `.aab` → complete data safety + content rating.

### App icon / splash / adaptive icons
Replace defaults in `assets/` (icon, splash, adaptive-icon, favicon). Export from `app.json` will warn if any are missing before you ship.

---

## 6. Post-release checks

- Dark-mode QA across every screen.
- Confirm biometric lock works on a physical device.
- Verify offline queue syncs when network returns.
- Add translation strings to **both** `en.ts` and `hi.ts` for any new UI text.

---

## Known limitations
- Client-side full account deletion isn't possible with the Appwrite web SDK — the "Delete account" action signs the user out locally and clears cached data. Implement true deletion with a server-side Appwrite Function + Users API if required.
- `.env` must contain real IDs before login / data operations will work.
