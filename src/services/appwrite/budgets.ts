import { DEMO_BUDGETS } from "../../data";
import type { Budget, BudgetPeriod } from "@t/index";

export interface BudgetDoc extends Budget {
  $id: string;
}

// In-memory store so create/update/delete reflect immediately in the UI
// during the demo session. Resets to the seed data on app restart.
const store: BudgetDoc[] = (DEMO_BUDGETS as unknown as BudgetDoc[]).map((b) => ({
  ...b,
  startDate: new Date(b.startDate),
}));

export async function getBudgets(userId: string): Promise<BudgetDoc[]> {
  return store.map((b) => ({ ...b, startDate: new Date(b.startDate) }));
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
  const budget: BudgetDoc = {
    $id: `budget_${Date.now()}`,
    userId,
    categoryId: data.categoryId,
    amount: data.amount,
    period: data.period,
    startDate: new Date(data.startDate),
    alertThresholdPercent: data.alertThresholdPercent ?? 80,
    createdAt: new Date().toISOString(),
  };
  store.push(budget);
  return { ...budget, startDate: new Date(budget.startDate) };
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
  const index = store.findIndex((b) => b.$id === budgetId);
  if (index === -1) return;
  store[index] = {
    ...store[index],
    ...data,
    startDate: data.startDate ? new Date(data.startDate) : store[index].startDate,
  };
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const index = store.findIndex((b) => b.$id === budgetId);
  if (index !== -1) store.splice(index, 1);
}