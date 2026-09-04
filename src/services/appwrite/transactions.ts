import { databases } from "./client";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";
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
  try {
    const queries: string[] = [Query.equal("userId", userId)];

    if (options?.accountId) queries.push(Query.equal("accountId", options.accountId));
    if (options?.categoryId) queries.push(Query.equal("categoryId", options.categoryId));
    if (options?.type) queries.push(Query.equal("type", options.type));
    if (options?.fromDate) queries.push(Query.greaterThanEqual("date", options.fromDate.toISOString()));
    if (options?.toDate) queries.push(Query.lessThanEqual("date", options.toDate.toISOString()));
    if (options?.limit) queries.push(Query.limit(options.limit));

    const sortOrder = options?.order === "asc" ? Query.orderAsc("date") : Query.orderDesc("date");
    queries.push(sortOrder);
    queries.push(options?.limit ? Query.limit(options.limit) : Query.limit(100));

    const result = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.transactions,
      queries
    );

    return result.documents.map((doc) => normalizeTransaction(doc));
  } catch (error) {
    console.error("Get transactions error:", error);
    return [];
  }
}

export async function createTransaction(
  data: CreateTransactionData
): Promise<TransactionDoc> {
  const result = await databases.createDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.transactions,
    "unique()",
    {
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
      date: data.date.toISOString(),
      paymentMethod: data.paymentMethod ?? "",
      tags: data.tags ?? [],
      isRecurring: data.isRecurring,
      recurringRuleId: data.recurringRuleId ?? "",
    }
  );

  return normalizeTransaction(result);
}

export async function updateTransaction(
  transactionId: string,
  data: Partial<CreateTransactionData>
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (data.accountId !== undefined) updateData.accountId = data.accountId;
  if (data.toAccountId !== undefined) updateData.toAccountId = data.toAccountId;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.convertedAmount !== undefined) updateData.convertedAmount = data.convertedAmount;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.splits !== undefined) updateData.splits = data.splits;
  if (data.note !== undefined) updateData.note = data.note;
  if (data.receiptFileId !== undefined) updateData.receiptFileId = data.receiptFileId;
  if (data.date !== undefined) updateData.date = data.date.toISOString();
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
  if (data.recurringRuleId !== undefined) updateData.recurringRuleId = data.recurringRuleId;

  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.transactions,
    transactionId,
    updateData
  );
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.transactions,
    transactionId
  );
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
