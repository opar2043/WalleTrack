# Walletrack

Personal finance tracking on your phone: an Express 5 + MongoDB API and a
React Native (Expo SDK 57) app for tracking accounts, transactions, budgets,
analytics and insights — free tier with one optional Premium tier.

## Layout

```
walletrack-server/   Express 5 + MongoDB driver 7 API (CommonJS)
walletrack-frontend/ Expo SDK 57 / React Native 0.86 mobile app (TypeScript)
```

More docs: [`DESIGN.md`](DESIGN.md), [`SKILL.md`](SKILL.md),
[`walletrack-server/walletrack-api.http`](walletrack-server/walletrack-api.http).

## Run it

Backend (API at `http://localhost:4000/api/v1`):

```bash
cd walletrack-server
cp .env.example .env      # set MONGODB_URI + DB_NAME
npm install
npm run dev               # or: npm run test:api for the full smoke suite
```

Frontend:

```bash
cd walletrack-frontend
npm install
npm start                 # Expo dev server
```

Android emulator/iOS simulator work out of the box. For a physical Android
device: `adb reverse tcp:4000 tcp:4000`, then `npm run android`. The API URL
comes from `app.json` → `extra.apiUrl`.

## Scripts

| Command                | Where                 | What it does                     |
| ---------------------- | --------------------- | -------------------------------- |
| `npm run dev`          | walletrack-server     | API with file watching           |
| `npm run test:api`     | walletrack-server     | Full API smoke suite             |
| `npm run lint`         | walletrack-server     | ESLint                          |
| `npm run format:check` | walletrack-server     | Prettier check                   |
| `npm run seed`         | walletrack-server     | Seed demo data                   |
| `npm start`            | walletrack-frontend   | Expo dev server                  |
| `npm run typecheck`    | walletrack-frontend   | `tsc --noEmit`                   |
| `npm run android`/`ios`| walletrack-frontend   | Launch on that platform          |
| `npm run bundle:android`| walletrack-frontend  | Verify the app bundles to APK/AAB |

## Notes

- Opaque bearer sessions (`wt_…`, 64 hex chars), only their SHA-256 hash is
  stored. Passwords are bcrypt-hashed.
- Money is integer minor units everywhere (e.g. 499 = $4.99).
- Every user-owned query is scoped by `userId`; Helmet, CORS, and rate
  limiting are on.
- Remaining for a store release: Google Play Billing token verification, EAS
  signing, and store metadata (see `SKILL.md`).