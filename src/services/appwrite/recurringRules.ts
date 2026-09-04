import { databases } from "./client";
import { Query } from "react-native-appwrite";
import { APPWRITE_ENV } from "./client";
import type { RecurringRule, RecurringFrequency } from "@t/index";

export interface RecurringRuleDoc extends RecurringRule {
  $id: string;
}

export async function getRecurringRules(
  userId: string
): Promise<RecurringRuleDoc[]> {
  try {
    const result = await databases.listDocuments(
      APPWRITE_ENV.databaseId,
      APPWRITE_ENV.collections.recurringRules,
      [Query.equal("userId", userId), Query.limit(100)]
    );

    return result.documents.map((doc) => ({
      $id: doc.$id,
      userId: doc.userId,
      templateTransaction: doc.templateTransaction,
      frequency: doc.frequency as RecurringFrequency,
      nextRunDate: new Date(doc.nextRunDate),
      endDate: doc.endDate ? new Date(doc.endDate) : undefined,
      reminderEnabled: doc.reminderEnabled ?? false,
      createdAt: doc.createdAt,
    }));
  } catch (error) {
    console.error("Get recurring rules error:", error);
    return [];
  }
}

export async function createRecurringRule(
  userId: string,
  data: {
    templateTransaction: RecurringRule["templateTransaction"];
    frequency: RecurringFrequency;
    nextRunDate: Date;
    endDate?: Date;
    reminderEnabled: boolean;
  }
): Promise<RecurringRuleDoc> {
  const result = await databases.createDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.recurringRules,
    "unique()",
    {
      userId,
      templateTransaction: data.templateTransaction,
      frequency: data.frequency,
      nextRunDate: data.nextRunDate.toISOString(),
      endDate: data.endDate?.toISOString() ?? "",
      reminderEnabled: data.reminderEnabled,
    }
  );

  return {
    $id: result.$id,
    userId: result.userId,
    templateTransaction: result.templateTransaction,
    frequency: result.frequency as RecurringFrequency,
    nextRunDate: new Date(result.nextRunDate),
    endDate: result.endDate ? new Date(result.endDate) : undefined,
    reminderEnabled: result.reminderEnabled ?? false,
    createdAt: result.createdAt,
  };
}

export async function updateRecurringRule(
  ruleId: string,
  data: Partial<{
    templateTransaction: RecurringRule["templateTransaction"];
    frequency: RecurringFrequency;
    nextRunDate: Date;
    endDate?: Date;
    reminderEnabled: boolean;
  }>
): Promise<void> {
  const updateData: Record<string, unknown> = {};
  if (data.templateTransaction) updateData.templateTransaction = data.templateTransaction;
  if (data.frequency) updateData.frequency = data.frequency;
  if (data.nextRunDate) updateData.nextRunDate = data.nextRunDate.toISOString();
  if (data.endDate) updateData.endDate = data.endDate.toISOString();
  if (data.reminderEnabled !== undefined) updateData.reminderEnabled = data.reminderEnabled;

  await databases.updateDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.recurringRules,
    ruleId,
    updateData
  );
}

export async function deleteRecurringRule(ruleId: string): Promise<void> {
  await databases.deleteDocument(
    APPWRITE_ENV.databaseId,
    APPWRITE_ENV.collections.recurringRules,
    ruleId
  );
}
