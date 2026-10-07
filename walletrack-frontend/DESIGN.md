# Walletrack — design

## 1. System shape

```
walletrack-server/   REST API, Express 5, MongoDB native driver 7, Zod validation
walletrack-frontend/ Expo SDK 57, React Native 0.86, TypeScript, React Navigation 7,
                     Zustand (session), TanStack Query (server state), NativeWind (styling)
```

Two separate sources of truth and one rule: the **API is the only authority on
finances**. The app holds session identity (`useAuthStore`) and a client cache
(`QueryClient`); every user-owned query and every balance change goes through
the API, which enforces free-tier limits.

## 2. Data model

Collections (`src/config/db.js` owns names + indexes): `users`, `accounts`,
`categories`, `transactions`, `budgets`, `sessions`.

- **users** — name, email (unique), bcrypt password hash, `country`, `currency`,
  `locale`, `avatarColor`, `themePreference`, `notificationsEnabled`,
  `hideBalances`, `onboardingCompleted`, premium fields, timestamps.
- **accounts** — `userId`, name, type (cash/bank/credit/savings/investment),
  `currency`, `startingBalance`, derived `balance`, color, icon, note,
  `isArchived`.
- **categories** — `userId`, name, type (income/expense), optional color+icon,
  unique `(userId, key)` where `key` is a normalized slug.
- **transactions** — `userId`, `accountId`, `categoryId`, type
  (income/expense/transfer), `amount` (minor units, positive ints), `note`,
  `date`. Each mutation recomputes and reconciles the owning account's balance.
- **budgets** — `userId`, `month` (YYYY-MM), optional `categoryId`, name,
  `monthlyLimit` (minor units). Unique `(userId, categoryId, month)` per named
  budget; category budgets are unique by category.

### Money

All amounts are **integer minor units** end-to-end (499 = $4.99). The API
rejects non-integers; the app only formats (`src/utils/format.ts`).

## 3. API contract

Base: `{baseUrl}/api/v1`. Every response uses the envelope
`{ success, message, data }`. Errors: `{ success:false, message, errors? }`
with `errors` as `{ path, message }[]` for field-level form binding.

Auth: `Authorization: Bearer <token>`, where the token is an opaque session
(`wt_` + 64 hex). Sessions auto-expire (`SESSION_EXPIRES`, default 30d); a 401
wipes local state. Password changes revoke all sessions.

| Method + route                        | Purpose                          |
| ------------------------------------- | -------------------------------- |
| `POST   /auth/register`               | Create account, seed defaults    |
| `POST   /auth/login`                  | Sign in                          |
| `POST   /auth/logout`                 | Revoke current session           |
| `POST   /auth/logout-all`             | Revoke every session             |
| `POST   /auth/change-password`        | Change password (kills sessions) |
| `GET    /users/me`                    | Profile                          |
| `PATCH  /users/me`                    | Update name / avatarColor / email|
| `POST   /users/me/onboarding`         | Save region, mark onboarding done|
| `PATCH  /users/me/preferences`        | Theme / notifications / hideBalances / region |
| `DELETE /users/me`                    | Delete account + all data        |
| `GET    /accounts`                    | List (archive filter)            |
| `POST   /accounts`                    | Create                          |
| `POST   /accounts/:id/archive`        | Archive / unarchive              |
| `PATCH  /accounts/:id`                | Rename / adjust balance          |
| `DELETE /accounts/:id`                | Delete                          |
| `GET    /categories`                  | List (income / expense filter)   |
| `POST   /categories`                  | Create custom category           |
| `PATCH  /categories/:id`              | Update                          |
| `DELETE /categories/:id`              | Delete                          |
| `GET    /transactions`                | Paginated + filters              |
| `POST   /transactions`                | Create, reconcile account        |
| `GET    /transactions/:id`            | Detail                          |
| `PATCH  /transactions/:id`            | Update, reconcile account        |
| `DELETE /transactions/:id`            | Delete, reconcile account        |
| `GET    /budgets?month=`              | Budgets + summary for a month    |
| `POST   /budgets`                     | Create budget                    |
| `POST   /budgets/copy`                | Copy month → month               |
| `PATCH  /budgets/:id`                 | Update limit / name / category   |
| `DELETE /budgets/:id`                 | Delete                          |
| `GET    /dashboard?range=7\|30`       | Dashboard snapshot               |
| `GET    /analytics/monthly?month=`    | Monthly analytics                |
| `GET    /analytics/months`            | Available months                 |
| `GET    /analytics/categories/:id?month=` | Category drill-down          |
| `GET    /insights?month=`             | Insights                         |
| `GET    /premium/plans`               | Public plans + benefits          |
| `GET    /premium/status`              | Entitlement + limits             |
| `GET    /premium/limits`              | Current tier limits              |
| `POST   /premium/purchase`            | Record a verified purchase       |
| `POST   /premium/restore`             | Record a restored purchase       |
| `POST   /premium/cancel`              | Clear local entitlement          |

See `walletrack-server/walletrack-api.http` for complete request/response
examples of every endpoint.

## 4. Security decisions

- Opaque sessions, not JWTs. Raw tokens live only on the device
  (`expo-secure-store`) and in the client's memory for the duration of a
  request; MongoDB stores SHA-256 hashes only.
- Passwords: bcrypt, cost 12.
- Request hardening: Helmet, CORS allow-list, body size limit, global rate
  limit + a strict auth limiter.
- Scope: every collection query filters by `userId`; a deleted user's session
  stops authenticating immediately.
- No third-party analytics in either codebase.

## 5. Free tier vs Premium

Limits (single source of truth: `walletrack-server/src/config/limits.js`):

| Cap                    | Free         | Premium            |
| ---------------------- | ------------ | ------------------ |
| Accounts / budgets     | 3 / 5        | Unlimited          |
| Custom categories      | 5            | Unlimited          |
| Months of history      | 12           | Unlimited          |
| Advanced analytics     | No           | Yes                |
| Data export            | No           | Yes                |

## 6. Premium & Google Play

The service records entitlements; **it does not touch payment methods**. The
stub `verifyPurchaseToken()` in `src/module/route/premium/premium.js` is the
single integration point — swap it for a real Play Publisher (or RevenueCat)
check and nothing else changes. The mobile build intentionally leaves the
purchase/restore buttons at "billing not connected" until then.

## 7. Frontend layout

- **NativeWind** — `tailwind.config.js` holds tokens; palettes in
  `src/theme/tokens.ts`; `ThemeProvider` resolves system/light/dark and feeds
  charts + native navigation.
- **Session** — `authStore` bootstraps from SecureStore, never holds the raw
  token inside React state.
- **Server state** — one hook file (`src/hooks/queries.ts`) maps endpoints to
  TanStack Query keys and declares invalidation per mutation.
- **Money/date** — formatting is centralized in `src/utils/format.ts`; amount
  inputs convert to minor units before leaving the form.
- **Navigation** — one root stack (`RootNavigator.tsx`), custom five-slot tab
  bar (`MainTabNavigator.tsx`), modals for forms/region.