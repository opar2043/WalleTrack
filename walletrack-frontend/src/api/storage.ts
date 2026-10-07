/**
 * Session storage. The opaque session token returned by the API is a bearer
 * credential, so it lives in `expo-secure-store` (Keychain /
 * EncryptedSharedPreferences) and never in AsyncStorage. Every network request
 * reads it from here.
 *
 * `expo-secure-store` ships an empty stub on web (`export default {}`), so the
 * browser falls back to localStorage — the closest equivalent a web page has.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'walletrack.session.token';
const EXPIRY_KEY = 'walletrack.session.expiresAt';

const isWeb = Platform.OS === 'web';

function webStore(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    // Storage can be denied outright (private mode, blocked cookies).
    return null;
  }
}

async function readValue(key: string): Promise<string | null> {
  if (isWeb) return webStore()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function writeValue(key: string, value: string): Promise<void> {
  if (isWeb) {
    // The in-memory copy above already keeps this page alive, so a rejected
    // write degrades to "sign in again after reload" instead of failing login.
    webStore()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeValue(key: string): Promise<void> {
  if (isWeb) {
    webStore()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

let cachedToken: string | null = null;
let cachedExpiry: string | null = null;
let hydrated = false;

export async function hydrateSession(): Promise<{
  token: string | null;
  expiresAt: string | null;
}> {
  if (hydrated) return { token: cachedToken, expiresAt: cachedExpiry };
  try {
    const [token, expiresAt] = await Promise.all([
      readValue(TOKEN_KEY),
      readValue(EXPIRY_KEY),
    ]);
    cachedToken = token;
    cachedExpiry = expiresAt;
  } catch {
    // A corrupt keystore entry must never brick the app: fall back to signed out.
    cachedToken = null;
    cachedExpiry = null;
  }
  hydrated = true;
  return { token: cachedToken, expiresAt: cachedExpiry };
}

export async function saveSession(token: string, expiresAt?: string | null): Promise<void> {
  cachedToken = token;
  cachedExpiry = expiresAt ?? null;
  hydrated = true;
  // An absent expiry must never be written: browsers would store the literal
  // string "undefined" and native keystores reject a non-string value.
  await Promise.all([
    writeValue(TOKEN_KEY, token),
    expiresAt ? writeValue(EXPIRY_KEY, expiresAt) : removeValue(EXPIRY_KEY),
  ]);
}

export async function clearSession(): Promise<void> {
  cachedToken = null;
  cachedExpiry = null;
  hydrated = true;
  try {
    await Promise.all([removeValue(TOKEN_KEY), removeValue(EXPIRY_KEY)]);
  } catch {
    // Nothing actionable: the in-memory copy is already gone.
  }
}

export function peekToken(): string | null {
  return cachedToken;
}
