import { create } from "zustand";
import type { Account, AccountType } from "@t/index";
import * as AccountService from "@services/appwrite/accounts";
import { enqueueOperation, getQueue, removeOperation } from "@services/offline/queue";
import { isOnline } from "@services/offline/network";

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  loadAccounts: (userId: string) => Promise<void>;
  addAccount: (userId: string, data: {
    name: string;
    type: AccountType;
    currency: string;
    balance: number;
    icon: string;
    color: string;
    cardLast4?: string;
  }) => Promise<Account | null>;
  updateAccount: (accountId: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  adjustBalance: (accountId: string, delta: number) => void;
  syncAccounts: () => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,

  loadAccounts: async (userId) => {
    set({ isLoading: true });

    if (!isOnline()) {
      const cached = useAccountsStore.getState().accounts;
      if (cached.length > 0) {
        set({ isLoading: false });
        return;
      }
    }

    const result = await AccountService.getAccounts(userId);
    const accounts = result.map((a) => ({
      $id: a.$id,
      userId: a.userId,
      name: a.name,
      type: a.type,
      currency: a.currency,
      balance: a.balance,
      icon: a.icon,
      color: a.color,
      cardLast4: a.cardLast4,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
    set({ accounts, isLoading: false });
  },

  addAccount: async (userId, data) => {
    if (!isOnline()) {
      enqueueOperation("accounts", "create", {
        userId,
        ...data,
      });
      const newAccount: Account = {
        $id: `local_${Date.now()}`,
        userId,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: data.balance,
        icon: data.icon,
        color: data.color,
        cardLast4: data.cardLast4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({ accounts: [...state.accounts, newAccount] }));
      return newAccount;
    }

    try {
      const result = await AccountService.createAccount(userId, data);
      const newAccount: Account = {
        $id: result.$id,
        userId: result.userId,
        name: result.name,
        type: result.type,
        currency: result.currency,
        balance: result.balance,
        icon: result.icon,
        color: result.color,
        cardLast4: result.cardLast4,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
      set((state) => ({ accounts: [...state.accounts, newAccount] }));
      return newAccount;
    } catch (error) {
      console.error("Add account error:", error);
      return null;
    }
  },

  updateAccount: async (accountId, data) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.$id === accountId ? { ...a, ...data } : a
      ),
    }));

    if (!isOnline()) {
      enqueueOperation("accounts", "update", data as Record<string, unknown>, accountId);
      return;
    }

    try {
      await AccountService.updateAccount(accountId, {
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance: data.balance,
        icon: data.icon,
        color: data.color,
        cardLast4: data.cardLast4,
      });
    } catch (error) {
      console.error("Update account error:", error);
    }
  },

  deleteAccount: async (accountId) => {
    set((state) => ({
      accounts: state.accounts.filter((a) => a.$id !== accountId),
    }));

    if (!isOnline()) {
      enqueueOperation("accounts", "delete", {}, accountId);
      return;
    }

    try {
      await AccountService.deleteAccount(accountId);
    } catch (error) {
      console.error("Delete account error:", error);
    }
  },

  adjustBalance: (accountId, delta) => {
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.$id === accountId ? { ...a, balance: a.balance + delta } : a
      ),
    }));
  },

  syncAccounts: async () => {
    const queue = getQueue().filter((op) => op.collection === "accounts");
    if (queue.length === 0 || !isOnline()) return;

    for (const op of queue) {
      try {
        if (op.action === "create") {
          await AccountService.createAccount(
            op.data.userId as string,
            {
              name: op.data.name as string,
              type: op.data.type as AccountType,
              currency: op.data.currency as string,
              balance: op.data.balance as number,
              icon: op.data.icon as string,
              color: op.data.color as string,
              cardLast4: op.data.cardLast4 as string | undefined,
            }
          );
        } else if (op.action === "update" && op.documentId) {
          await AccountService.updateAccount(op.documentId, {
            name: op.data.name as string,
            type: op.data.type as AccountType,
            currency: op.data.currency as string,
            balance: op.data.balance as number,
            icon: op.data.icon as string,
            color: op.data.color as string,
            cardLast4: op.data.cardLast4 as string,
          });
        } else if (op.action === "delete" && op.documentId) {
          await AccountService.deleteAccount(op.documentId);
        }
        removeOperation(op.id);
      } catch (error) {
        console.error("Sync account error:", error);
      }
    }
  },
}));
