import { databases } from "./client";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";
import type { Budget, BudgetPeriod } from "@t/index";

export interface BudgetDoc extends Budget {
  $id: string;
}

export async function getBudgets(userId: string): Promise<BudgetDoc[]> {
  try {
    const result = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.budgets,
      [Query.equal("userId", userId), Query.limit(100)]
    );

    return result.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      categoryId: doc.categoryId,
      amount: doc.amount,
      period: doc.period as BudgetPeriod,
      startDate: new Date(doc.startDate),
      alertThresholdPercent: doc.alertThresholdPercent ?? 80,
      createdAt: doc.createdAt,
    }));
  } catch (error) {
    console.error("Get budgets error:", error);
    return [];
  }
}

export async function createBudget(
  userId: string,
  data: {
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    alertThresholdPercent: number;
  }
): Promise<BudgetDoc> {
  const result = await databases.createDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.budgets,
    "unique()",
    {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      period: data.period,
      startDate: data.startDate.toISOString(),
      alertThresholdPercent: data.alertThresholdPercent,
    }
  );

  return {
    $id: result.$id,
    userId: result.userId,
    categoryId: result.categoryId,
    amount: result.amount,
    period: result.period as BudgetPeriod,
    startDate: new Date(result.startDate),
    alertThresholdPercent: result.alertThresholdPercent ?? 80,
    createdAt: result.createdAt,
  };
}

export async function updateBudget(
  budgetId: string,
  data: Partial<{
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    alertThresholdPercent: number;
  }>
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.period !== undefined) updateData.period = data.period;
  if (data.startDate !== undefined) updateData.startDate = data.startDate.toISOString();
  if (data.alertThresholdPercent !== undefined) updateData.alertThresholdPercent = data.alertThresholdPercent;

  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.budgets,
    budgetId,
    updateData
  );
}

export async function deleteBudget(budgetId: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.budgets,
    budgetId
  );
}
