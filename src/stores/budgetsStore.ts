import { create } from "zustand";
import type { Budget, BudgetPeriod } from "@t/index";
import * as BudgetService from "@services/appwrite/budgets";
import { enqueueOperation, getQueue, removeOperation } from "@services/offline/queue";
import { isOnline } from "@services/offline/network";
import { useTransactionsStore } from "./transactionsStore";

interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  loadBudgets: (userId: string) => Promise<void>;
  addBudget: (userId: string, data: {
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
    startDate: Date;
    alertThresholdPercent: number;
  }) => Promise<Budget | null>;
  updateBudget: (budgetId: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  getSpentForBudget: (budget: Budget) => number;
  getBudgetProgress: (budget: Budget) => number;
  syncBudgets: () => Promise<void>;
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: [],
  isLoading: false,

  loadBudgets: async (userId) => {
    set({ isLoading: true });
    const result = await BudgetService.getBudgets(userId);
    const budgets = result.map((b) => ({
      $id: b.$id,
      userId: b.userId,
      categoryId: b.categoryId,
      amount: b.amount,
      period: b.period,
      startDate: new Date(b.startDate),
      alertThresholdPercent: b.alertThresholdPercent,
      createdAt: b.createdAt,
    }));
    set({ budgets, isLoading: false });
  },

  addBudget: async (userId, data) => {
    if (!isOnline()) {
      enqueueOperation("budgets", "create", {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate.toISOString(),
        alertThresholdPercent: data.alertThresholdPercent,
      });
      const newBudget: Budget = {
        $id: `local_${Date.now()}`,
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
        alertThresholdPercent: data.alertThresholdPercent,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ budgets: [...state.budgets, newBudget] }));
      return newBudget;
    }

    try {
      const result = await BudgetService.createBudget(userId, data);
      const newBudget: Budget = {
        $id: result.$id,
        userId: result.userId,
        categoryId: result.categoryId,
        amount: result.amount,
        period: result.period,
        startDate: new Date(result.startDate),
        alertThresholdPercent: result.alertThresholdPercent,
        createdAt: result.createdAt,
      };
      set((state) => ({ budgets: [...state.budgets, newBudget] }));
      return newBudget;
    } catch (error) {
      console.error("Add budget error:", error);
      return null;
    }
  },

  updateBudget: async (budgetId, data) => {
    set((state) => ({
      budgets: state.budgets.map((b) =>
        b.$id === budgetId ? { ...b, ...data } : b
      ),
    }));

    if (!isOnline()) {
      enqueueOperation("budgets", "update", data as unknown as Record<string, unknown>, budgetId);
      return;
    }

    try {
      await BudgetService.updateBudget(budgetId, {
        categoryId: data.categoryId,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate,
        alertThresholdPercent: data.alertThresholdPercent,
      });
    } catch (error) {
      console.error("Update budget error:", error);
    }
  },

  deleteBudget: async (budgetId) => {
    set((state) => ({
      budgets: state.budgets.filter((b) => b.$id !== budgetId),
    }));

    if (!isOnline()) {
      enqueueOperation("budgets", "delete", {}, budgetId);
      return;
    }

    try {
      await BudgetService.deleteBudget(budgetId);
    } catch (error) {
      console.error("Delete budget error:", error);
    }
  },

  getSpentForBudget: (budget) => {
    const { transactions } = useTransactionsStore.getState();
    const now = new Date();

    let startDate: Date;
    switch (budget.period) {
      case "weekly": {
        const day = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case "monthly":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now);
    }

    return transactions
      .filter((t) => {
        const txDate = new Date(t.date);
        return (
          t.type === "expense" &&
          t.categoryId === budget.categoryId &&
          txDate >= startDate &&
          txDate <= now
        );
      })
      .reduce((sum, t) => sum + t.convertedAmount, 0);
  },

  getBudgetProgress: (budget) => {
    const spent = get().getSpentForBudget(budget);
    return budget.amount > 0 ? spent / budget.amount : 0;
  },

  syncBudgets: async () => {
    const queue = getQueue().filter((op) => op.collection === "budgets");
    if (queue.length === 0 || !isOnline()) return;

    for (const op of queue) {
      try {
        if (op.action === "create") {
          await BudgetService.createBudget(op.data.userId as string, {
            categoryId: op.data.categoryId as string,
            amount: op.data.amount as number,
            period: op.data.period as BudgetPeriod,
            startDate: new Date(op.data.startDate as string),
            alertThresholdPercent: op.data.alertThresholdPercent as number,
          });
        } else if (op.action === "update" && op.documentId) {
          await BudgetService.updateBudget(op.documentId, {
            categoryId: op.data.categoryId as string,
            amount: op.data.amount as number,
            period: op.data.period as BudgetPeriod,
            startDate: op.data.startDate ? new Date(op.data.startDate as string) : new Date(),
            alertThresholdPercent: op.data.alertThresholdPercent as number,
          });
        } else if (op.action === "delete" && op.documentId) {
          await BudgetService.deleteBudget(op.documentId);
        }
        removeOperation(op.id);
      } catch (error) {
        console.error("Sync budget error:", error);
      }
    }
  },
}));
