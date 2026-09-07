import { DEMO_ACCOUNTS } from "../../data";
import type { Account, AccountType } from "@t/index";

export interface AccountDoc extends Account {
  $id: string;
}

// In-memory store so create/update/delete reflect immediately in the UI
// during the demo session. Resets to the seed data on app restart.
const store: AccountDoc[] = (DEMO_ACCOUNTS as unknown as AccountDoc[]).map(
  (a) => ({ ...a })
);

export async function getAccounts(userId: string): Promise<AccountDoc[]> {
  return store.map((a) => ({ ...a }));
}

export async function createAccount(
  userId: string,
  data: {
    name: string;
    type: AccountType;
    currency: string;
    balance: number;
    icon: string;
    color: string;
    cardLast4?: string;
  }
): Promise<AccountDoc> {
  const now = new Date().toISOString();
  const account: AccountDoc = {
    $id: `acc_${Date.now()}`,
    userId,
    name: data.name,
    type: data.type,
    currency: data.currency,
    balance: data.balance,
    icon: data.icon,
    color: data.color,
    cardLast4: data.cardLast4 ?? "",
    createdAt: now,
    updatedAt: now,
  };
  store.push(account);
  return { ...account };
}

export async function updateAccount(
  accountId: string,
  data: Partial<{
    name: string;
    type: AccountType;
    currency: string;
    balance: number;
    icon: string;
    color: string;
    cardLast4: string;
  }>
): Promise<void> {
  const index = store.findIndex((a) => a.$id === accountId);
  if (index === -1) return;
  store[index] = { ...store[index], ...data, updatedAt: new Date().toISOString() };
}

export async function adjustAccountBalance(
  accountId: string,
  delta: number
): Promise<void> {
  const index = store.findIndex((a) => a.$id === accountId);
  if (index === -1) return;
  store[index] = {
    ...store[index],
    balance: (store[index].balance ?? 0) + delta,
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteAccount(accountId: string): Promise<void> {
  const index = store.findIndex((a) => a.$id === accountId);
  if (index !== -1) store.splice(index, 1);
}