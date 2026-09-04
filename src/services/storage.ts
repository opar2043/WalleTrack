import { createMMKV } from "react-native-mmkv";

export const storage = createMMKV({
  id: "walletrack-storage",
});

export const CACHE_KEYS = {
  THEME: "@theme",
  LANGUAGE: "@language",
  CURRENCY: "@currency",
  NATIONALITY: "@nationality",
  ONBOARDING_DONE: "@onboarding_done",
  PROFILE: "@profile",
  EXCHANGE_RATES: "@exchange_rates",
  OFFLINE_QUEUE: "@offline_queue",
  SYNC_ACCOUNTS: "@sync_accounts",
  SYNC_CATEGORIES: "@sync_categories",
  SYNC_TRANSACTIONS: "@sync_transactions",
  SYNC_BUDGETS: "@sync_budgets",
  SYNC_PROFILE: "@sync_profile",
  BIOMETRIC_ENABLED: "@biometric_enabled",
} as const;

export function setItem<T>(key: string, value: T): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to store ${key}:`, error);
  }
}

export function getItem<T>(key: string): T | null {
  try {
    const value = storage.getString(key);
    if (value === undefined) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return null;
  }
}

export function getString(key: string): string | null {
  const value = storage.getString(key);
  return value === undefined ? null : value;
}

export function setString(key: string, value: string): void {
  storage.set(key, value);
}

export function getBoolean(key: string): boolean {
  return storage.getBoolean(key) ?? false;
}

export function setBoolean(key: string, value: boolean): void {
  storage.set(key, value);
}

export function removeItem(key: string): void {
  storage.remove(key);
}

export function clearAll(): void {
  storage.clearAll();
}
