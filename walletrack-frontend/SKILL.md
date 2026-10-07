# Walletrack — operations runbook

Hands-on playbook for developing, verifying, shipping and supporting the
Walletrack API and mobile app.

## 1. Verify everything, in order

```bash
# Backend unit + API surface
cd walletrack-server
npm run lint && npm run format:check
npm run test:api            # 63 checks, uses in-memory Mongo, no .env needed

# Frontend static health
cd ../walletrack-frontend
npm run typecheck           # tsc --noEmit
npx expo config --type public   # app.json / plugins sanity
npm run bundle:android      # proves Metro + Babel + NativeWind compile
```

A green `bundle:android` is the real compile check — TypeScript alone will not
catch a broken import at runtime.

## 2. Common failure modes

| Symptom                                    | Check                        | Fix |
| ------------------------------------------ | ---------------------------- | --- |
| `Authentication failed` on Atlas           | DB user password / IP allowlist | See §3 |
| App can't reach the API on a device        | `adb reverse tcp:4000 tcp:4000` | Re-run after replug |
| 404 on a screen                           | Route method mismatch        | Methods are POST for onboarding/archive/…, PATCH for edits |
| Session ends unexpectedly                  | `SESSION_EXPIRES`            | 401 clears local session by design |
| fetch `type: 'loading'` forever           | API not listening            | `curl localhost:4000/api/v1/health` |

## 3. MongoDB Atlas connectivity

Bad credentials / IP allowlist fail every auth source with
`bad auth : Authentication failed`.

1. Atlas → Database Access → add a dedicated DB user with
   "Read and write to any database".
2. Atlas → Network Access → allow the IP(s) the app runs from
   (`0.0.0.0/0` only for dev).
3. Put the SRV string in `walletrack-server/.env` as `MONGODB_URI`; the
   `authSource` in the connection string must match the user's auth database.
4. `npm run dev` then `curl localhost:4000/api/v1/health`.

## 4. Release checklist (Google Play)

Token verification and Play credentials are explicit integration points; the
code is otherwise release-shaped.

1. **Billing**: implement `verifyPurchaseToken()` in
   `walletrack-server/src/module/route/premium/premium.js` against the Play
   Publisher API (stub is permissive by design).
2. **Signing**: `eas build --platform android --profile production` once to
   generate the upload key, then set `eas.json` to reuse it.
3. **API URL**: change `walletrack-frontend/app.json` →
   `extra.apiUrl` to the deployed HTTPS endpoint.
4. **Metadata**: app name/summary/long description, screenshots, and a data
   safety form (Walletrack stores account data, does no ad tracking).
5. **Versioning**: bump `version`/`android.versionCode` in `app.json` per build.
6. **Privacy**: verified encryption in transit (TLS) and at rest (Atlas); no
   third-party analytics SDKs need declaring.

## 5. Deleting user data

`DELETE /api/v1/users/me` (authenticated) deletes the profile and all
user-owned collections via the delete-account transaction, then revokes the
session. Trigger with a support person under the user's explicit request.

## 6. Money

All amounts are integer minor units end-to-end; `utils/format` in the app only
formats. Never send a float from the client — the API rejects it.