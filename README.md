# Walletrack

Personal finance tracking on your phone: a production-style Express + MongoDB
backend and a React Native (Expo SDK 57) app. Track accounts, transactions,
budgets, analytics and insight on a free tier with a single optional Premium
tier — no ads, no third-party analytics, your data stays yours.

## Architecture

```
walletrack-server/   Express 5 + MongoDB driver 7 API (CommonJS)
walletrack-frontend/ Expo SDK 57 / React Native 0.86 mobile app (TypeScript)
```

- **API** for design and endpoint contracts → [`DESIGN.md`](DESIGN.md)
- **Operational runbook** → [`SKILL.md`](SKILL.md)
- Manual API requests → [`walletrack-server/walletrack-api.http`](walletrack-server/walletrack-api.http)

## Prerequisites

- Node.js ≥ 18.18
- MongoDB Atlas (or a local `mongod`) — see `walletrack-server/.env.example`
- [Expo Go](https://expo.dev/go) on your phone, or an iOS/Android simulator
- For test runs, `mongodb-memory-server` downloads a MongoDB binary on first use

## Run it

### 1. Backend

```bash
cd walletrack-server
cp .env.example .env         # set MONGODB_URI + DB_NAME
npm install
npm run dev                  # http://localhost:4000/api/v1
```

Seed sample data (optional):

```bash
npm run seed
```

Verify the whole API in one pass (uses an in-memory MongoDB):

```bash
npm run test:api             # 63 checks, expects to pass in full
npm run lint
npm run format:check
```

### 2. Frontend

```bash
cd walletrack-frontend
npm install
npm start                    # Expo dev server
```

- iOS simulator / Expo Go: works out of the box (`localhost:4000`).
- Android emulator: works out of the box.
- Physical Android device:

  ```bash
  adb reverse tcp:4000 tcp:4000
  npm run android
  ```

The app reads its API URL from `app.json` → `extra.apiUrl`. Point it at a
deployed API before a release build.

## Scripts

| Command                   | Where                 | What it does                          |
| ------------------------- | --------------------- | ------------------------------------- |
| `npm run dev`             | walletrack-server     | API with file watching                |
| `npm run start`           | walletrack-server     | API (production entry)                |
| `npm run test:api`        | walletrack-server     | Full API smoke suite (63 checks)      |
| `npm run lint`            | walletrack-server     | ESLint                               |
| `npm run format:check`    | walletrack-server     | Prettier check                        |
| `npm run seed`            | walletrack-server     | Seed demo data                        |
| `npm start`               | walletrack-frontend   | Expo dev server                       |
| `npm run android` / `ios` | walletrack-frontend   | Launch on that platform               |
| `npm run typecheck`       | walletrack-frontend   | `tsc --noEmit`                        |
| `npm run bundle:android`  | walletrack-frontend   | Verify the app bundles to APK/AAB     |

## Auth and sessions

- Opaque bearer sessions (`wt_…`, 64 hex chars). No JWT.
- Only the SHA-256 hash of a token is stored in MongoDB; the raw token lives in
  the device keychain (`expo-secure-store`) and is never persisted in app state.
- Passwords are bcrypt-hashed. Sessions expire via `SESSION_EXPIRES` (default 30d).
- Permissions and free-tier limits are enforced server-side, keyed by `userId`.

## Security

- Helmet, CORS, compression, request size limits, global + auth rate limiting.
- Every user-owned query is scoped by `userId`.
- Money is integer minor units everywhere (e.g. 499 = $4.99).
- No third-party analytics or SDKs in either codebase.

## Premium & payments

The server exposes plans, status, limits, purchase, restore and cancel
endpoints. Google Play token verification is an explicit integration point in
`walletrack-server/src/module/route/premium/premium.js` (`verifyPurchaseToken`),
on purpose: real billing SDK wiring is the last remaining production step and
is documented there and in `DESIGN.md`.

## Status

- Backend: complete; 63 API checks green, lint + format clean.
- Frontend: full feature set implemented, typechecks clean and bundles for
  Android and iOS.
- Remaining for a store release: Play developer credentials + Google Play
  Billing token verification, EAS signing, store metadata. See `SKILL.md`.
