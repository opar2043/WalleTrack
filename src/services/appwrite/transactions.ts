import { DEMO_TRANSACTIONS } from "../../data";
import type { Transaction, TransactionType, TransactionSplit } from "@t/index";

export interface TransactionDoc extends Transaction {
  $id: string;
}

export interface CreateTransactionData {
  userId: string;
  accountId: string;
  toAccountId?: string;
  type: TransactionType;
  amount: number;
  currency: string;
  convertedAmount: number;
  categoryId?: string;
  splits?: TransactionSplit[];
  note?: string;
  receiptFileId?: string;
  date: Date;
  paymentMethod?: string;
  tags?: string[];
  isRecurring: boolean;
  recurringRuleId?: string;
}

// In-memory store so create/update/delete reflect immediately in the UI
// during the demo session. Resets to the seed data on app restart.
const store: TransactionDoc[] = DEMO_TRANSACTIONS.map((t) =>
  normalizeTransaction({ ...t })
);

export async function getTransactions(
  userId: string,
  options?: {
    accountId?: string;
    categoryId?: string;
    fromDate?: Date;
    toDate?: Date;
    type?: TransactionType;
    limit?: number;
    order?: "asc" | "desc";
  }
): Promise<TransactionDoc[]> {
  let result = store.filter((t) => t.userId === userId);

  if (options?.accountId) {
    result = result.filter((t) => t.accountId === options.accountId);
  }
  if (options?.categoryId) {
    result = result.filter((t) => t.categoryId === options.categoryId);
  }
  if (options?.type) {
    result = result.filter((t) => t.type === options.type);
  }
  if (options?.fromDate) {
    result = result.filter((t) => new Date(t.date) >= new Date(options.fromDate!));
  }
  if (options?.toDate) {
    result = result.filter((t) => new Date(t.date) <= new Date(options.toDate!));
  }

  result.sort((a, b) => {
    const cmp = new Date(b.date).getTime() - new Date(a.date).getTime();
    return options?.order === "asc" ? -cmp : cmp;
  });

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result.map((t) => ({ ...t, date: new Date(t.date) }));
}

export async function createTransaction(
  data: CreateTransactionData
): Promise<TransactionDoc> {
  const transaction: TransactionDoc = {
    $id: `txn_${Date.now()}`,
    userId: data.userId,
    accountId: data.accountId,
    toAccountId: data.toAccountId ?? "",
    type: data.type,
    amount: data.amount,
    currency: data.currency,
    convertedAmount: data.convertedAmount,
    categoryId: data.categoryId ?? "",
    splits: data.splits ?? [],
    note: data.note ?? "",
    receiptFileId: data.receiptFileId ?? "",
    date: new Date(data.date),
    paymentMethod: data.paymentMethod ?? "",
    tags: data.tags ?? [],
    isRecurring: data.isRecurring,
    recurringRuleId: data.recurringRuleId ?? "",
    createdAt: new Date().toISOString(),
  };
  store.unshift(transaction);
  return { ...transaction, date: new Date(transaction.date) };
}

export async function updateTransaction(
  transactionId: string,
  data: Partial<CreateTransactionData>
): Promise<void> {
  const index = store.findIndex((t) => t.$id === transactionId);
  if (index === -1) return;
  store[index] = {
    ...store[index],
    ...data,
    date: data.date ? new Date(data.date) : store[index].date,
  };
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const index = store.findIndex((t) => t.$id === transactionId);
  if (index !== -1) store.splice(index, 1);
}

function normalizeTransaction(doc: Record<string, unknown>): TransactionDoc {
  return {
    $id: doc.$id as string,
    userId: doc.userId as string,
    accountId: doc.accountId as string,
    toAccountId: doc.toAccountId as string | undefined,
    type: doc.type as TransactionType,
    amount: doc.amount as number,
    currency: doc.currency as string,
    convertedAmount: doc.convertedAmount as number,
    categoryId: doc.categoryId as string | undefined,
    splits: doc.splits as TransactionSplit[] | undefined,
    note: doc.note as string | undefined,
    receiptFileId: doc.receiptFileId as string | undefined,
    date: new Date(doc.date as string),
    paymentMethod: doc.paymentMethod as string | undefined,
    tags: doc.tags as string[] | undefined,
    isRecurring: doc.isRecurring as boolean,
    recurringRuleId: doc.recurringRuleId as string | undefined,
    createdAt: doc.createdAt as string,
  };
}