import { create } from "zustand";
import type { Transaction, TransactionType, TransactionSplit, Account } from "@t/index";
import * as TransactionService from "@services/appwrite/transactions";
import * as AccountService from "@services/appwrite/accounts";
import { enqueueOperation, getQueue, removeOperation } from "@services/offline/queue";
import { isOnline } from "@services/offline/network";
import { convertToBase } from "@services/exchange/rates";
import { useAccountsStore } from "./accountsStore";

interface TransactionsState {
  transactions: Transaction[];
  isLoading: boolean;
  loadTransactions: (
    userId: string,
    options?: {
      accountId?: string;
      categoryId?: string;
      fromDate?: Date;
      toDate?: Date;
      type?: TransactionType;
      limit?: number;
    }
  ) => Promise<Transaction[]>;
  addTransaction: (data: {
    userId: string;
    accountId: string;
    toAccountId?: string;
    type: TransactionType;
    amount: number;
    currency: string;
    baseCurrency: string;
    categoryId?: string;
    splits?: TransactionSplit[];
    note?: string;
    receiptFileId?: string;
    date: Date;
    paymentMethod?: string;
    tags?: string[];
    isRecurring?: boolean;
    recurringRuleId?: string;
  }) => Promise<Transaction | null>;
  updateTransaction: (transactionId: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  syncTransactions: () => Promise<void>;
  clear: () => void;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  isLoading: false,

  loadTransactions: async (userId, options) => {
    set({ isLoading: true });
    const result = await TransactionService.getTransactions(userId, options);
    const transactions = result.map((t) => ({
      $id: t.$id,
      userId: t.userId,
      accountId: t.accountId,
      toAccountId: t.toAccountId,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      convertedAmount: t.convertedAmount,
      categoryId: t.categoryId,
      splits: t.splits,
      note: t.note,
      receiptFileId: t.receiptFileId,
      date: new Date(t.date),
      paymentMethod: t.paymentMethod,
      tags: t.tags,
      isRecurring: t.isRecurring,
      recurringRuleId: t.recurringRuleId,
      createdAt: t.createdAt,
    }));
    set({ transactions, isLoading: false });
    return transactions;
  },

  addTransaction: async (data) => {
    if (!isOnline()) {
      enqueueOperation("transactions", "create", data as unknown as Record<string, unknown>);
      const newTransaction: Transaction = {
        $id: `local_${Date.now()}`,
        userId: data.userId,
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        convertedAmount: data.amount,
        categoryId: data.categoryId,
        splits: data.splits,
        note: data.note,
        receiptFileId: data.receiptFileId,
        date: data.date,
        paymentMethod: data.paymentMethod,
        tags: data.tags,
        isRecurring: data.isRecurring ?? false,
        recurringRuleId: data.recurringRuleId,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
      return newTransaction;
    }

    try {
      const convertedAmount = await convertToBase(
        data.amount,
        data.currency,
        data.baseCurrency
      );

      const result = await TransactionService.createTransaction({
        userId: data.userId,
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        convertedAmount,
        categoryId: data.categoryId,
        splits: data.splits,
        note: data.note,
        receiptFileId: data.receiptFileId,
        date: data.date,
        paymentMethod: data.paymentMethod,
        tags: data.tags,
        isRecurring: data.isRecurring ?? false,
        recurringRuleId: data.recurringRuleId,
      });

      // Adjust the account balance
      const delta =
        data.type === "income"
          ? data.amount
          : data.type === "expense"
          ? -data.amount
          : 0;

      if (delta !== 0) {
        useAccountsStore.getState().adjustBalance(data.accountId, delta);
        await AccountService.adjustAccountBalance(data.accountId, delta);

        if (data.type === "transfer" && data.toAccountId) {
          useAccountsStore.getState().adjustBalance(data.toAccountId, data.amount);
          await AccountService.adjustAccountBalance(data.toAccountId, data.amount);
        }
      }

      const newTransaction: Transaction = {
        $id: result.$id,
        userId: result.userId,
        accountId: result.accountId,
        toAccountId: result.toAccountId,
        type: result.type,
        amount: result.amount,
        currency: result.currency,
        convertedAmount: result.convertedAmount,
        categoryId: result.categoryId,
        splits: result.splits,
        note: result.note,
        receiptFileId: result.receiptFileId,
        date: new Date(result.date),
        paymentMethod: result.paymentMethod,
        tags: result.tags,
        isRecurring: result.isRecurring,
        recurringRuleId: result.recurringRuleId,
        createdAt: result.createdAt,
      };
      set((state) => ({ transactions: [newTransaction, ...state.transactions] }));
      return newTransaction;
    } catch (error) {
      console.error("Add transaction error:", error);
      return null;
    }
  },

  updateTransaction: async (transactionId, data) => {
    const current = get().transactions.find((t) => t.$id === transactionId);

    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.$id === transactionId ? { ...t, ...data } : t
      ),
    }));

    if (!isOnline()) {
      enqueueOperation("transactions", "update", data as unknown as Record<string, unknown>, transactionId);
      return;
    }

    try {
      // Reverse old balance adjustment
      if (current) {
        const oldDelta =
          current.type === "income"
            ? -current.amount
            : current.type === "expense"
            ? current.amount
            : 0;
        if (oldDelta !== 0) {
          await AccountService.adjustAccountBalance(current.accountId, oldDelta);
          useAccountsStore.getState().adjustBalance(current.accountId, oldDelta);
        }
      }

      await TransactionService.updateTransaction(transactionId, {
        accountId: data.accountId,
        toAccountId: data.toAccountId,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        convertedAmount: data.convertedAmount,
        categoryId: data.categoryId,
        splits: data.splits,
        note: data.note,
        receiptFileId: data.receiptFileId,
        date: data.date ? (data.date instanceof Date ? data.date : new Date(data.date)) : new Date(),
        paymentMethod: data.paymentMethod,
        tags: data.tags,
        isRecurring: data.isRecurring,
        recurringRuleId: data.recurringRuleId,
      });

      if (data.type && data.amount && data.accountId) {
        const newDelta =
          data.type === "income"
            ? data.amount
            : data.type === "expense"
            ? -data.amount
            : 0;
        if (newDelta !== 0) {
          await AccountService.adjustAccountBalance(data.accountId, newDelta);
          useAccountsStore.getState().adjustBalance(data.accountId, newDelta);
        }
      }
    } catch (error) {
      console.error("Update transaction error:", error);
    }
  },

  deleteTransaction: async (transactionId) => {
    const tx = get().transactions.find((t) => t.$id === transactionId);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.$id !== transactionId),
    }));

    if (!isOnline()) {
      enqueueOperation("transactions", "delete", {}, transactionId);
      return;
    }

    try {
      await TransactionService.deleteTransaction(transactionId);

      if (tx) {
        const delta =
          tx.type === "income"
            ? -tx.amount
            : tx.type === "expense"
            ? tx.amount
            : 0;
        if (delta !== 0) {
          await AccountService.adjustAccountBalance(tx.accountId, delta);
          useAccountsStore.getState().adjustBalance(tx.accountId, delta);
        }
      }
    } catch (error) {
      console.error("Delete transaction error:", error);
    }
  },

  syncTransactions: async () => {
    const queue = getQueue().filter((op) => op.collection === "transactions");
    if (queue.length === 0 || !isOnline()) return;

    for (const op of queue) {
      try {
        if (op.action === "create") {
          const raw = op.data as unknown as {
            userId: string;
            accountId: string;
            toAccountId?: string;
            type: TransactionType;
            amount: number;
            currency: string;
            baseCurrency: string;
            categoryId?: string;
            splits?: TransactionSplit[];
            note?: string;
            receiptFileId?: string;
            date: Date | string;
            paymentMethod?: string;
            tags?: string[];
            isRecurring?: boolean;
            recurringRuleId?: string;
          };
          const convertedAmount = await convertToBase(
            raw.amount,
            raw.currency,
            raw.baseCurrency
          );
          await TransactionService.createTransaction({
            userId: raw.userId,
            accountId: raw.accountId,
            toAccountId: raw.toAccountId,
            type: raw.type,
            amount: raw.amount,
            currency: raw.currency,
            convertedAmount,
            categoryId: raw.categoryId,
            splits: raw.splits,
            note: raw.note,
            receiptFileId: raw.receiptFileId,
            date: new Date(raw.date),
            paymentMethod: raw.paymentMethod,
            tags: raw.tags,
            isRecurring: raw.isRecurring ?? false,
            recurringRuleId: raw.recurringRuleId,
          });
        } else if (op.action === "update" && op.documentId) {
          await TransactionService.updateTransaction(op.documentId, op.data as never);
        } else if (op.action === "delete" && op.documentId) {
          await TransactionService.deleteTransaction(op.documentId);
        }
        removeOperation(op.id);
      } catch (error) {
        console.error("Sync transaction error:", error);
      }
    }
  },

  clear: () => set({ transactions: [], isLoading: false }),
}));
