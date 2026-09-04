import { databases } from "./client";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";
import type { Account, AccountType } from "@t/index";

export interface AccountDoc extends Account {
  $id: string;
}

export async function getAccounts(userId: string): Promise<AccountDoc[]> {
  try {
    const result = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.accounts,
      [Query.equal("userId", userId), Query.orderAsc("createdAt")]
    );

    return result.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      name: doc.name,
      type: doc.type as AccountType,
      currency: doc.currency,
      balance: doc.balance ?? 0,
      icon: doc.icon ?? "wallet",
      color: doc.color ?? "#6C5CE7",
      cardLast4: doc.cardLast4,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));
  } catch (error) {
    console.error("Get accounts error:", error);
    return [];
  }
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
  const result = await databases.createDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.accounts,
    "unique()",
    {
      userId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      balance: data.balance,
      icon: data.icon,
      color: data.color,
      cardLast4: data.cardLast4 ?? "",
    }
  );

  return {
    $id: result.$id,
    userId: result.userId,
    name: result.name,
    type: result.type as AccountType,
    currency: result.currency,
    balance: result.balance ?? 0,
    icon: result.icon ?? "wallet",
    color: result.color ?? "#6C5CE7",
    cardLast4: result.cardLast4,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
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
  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.accounts,
    accountId,
    data
  );
}

export async function adjustAccountBalance(
  accountId: string,
  delta: number
): Promise<void> {
  try {
    const doc = await databases.getDocument(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.accounts,
      accountId
    );
    const newBalance = (doc.balance ?? 0) + delta;
    await databases.updateDocument(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.accounts,
      accountId,
      { balance: newBalance }
    );
  } catch (error) {
    console.error("Adjust balance error:", error);
  }
}

export async function deleteAccount(accountId: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.accounts,
    accountId
  );
}
