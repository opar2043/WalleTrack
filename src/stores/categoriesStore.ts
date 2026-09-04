import { create } from "zustand";
import type { Category, CategoryType } from "@t/index";
import * as CategoryService from "@services/appwrite/categories";
import { enqueueOperation, getQueue, removeOperation } from "@services/offline/queue";
import { isOnline } from "@services/offline/network";

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  loadCategories: (userId: string) => Promise<void>;
  addCategory: (userId: string, data: {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }) => Promise<Category | null>;
  updateCategory: (categoryId: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (id: string | undefined) => Category | undefined;
  syncCategories: () => Promise<void>;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,

  loadCategories: async (userId) => {
    set({ isLoading: true });
    const result = await CategoryService.getCategories(userId);
    const categories = result.map((c) => ({
      $id: c.$id,
      userId: c.userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
    }));
    set({ categories, isLoading: false });
  },

  addCategory: async (userId, data) => {
    if (!isOnline()) {
      enqueueOperation("categories", "create", { userId, ...data });
      const newCategory: Category = {
        $id: `local_${Date.now()}`,
        userId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
      };
      set((state) => ({ categories: [...state.categories, newCategory] }));
      return newCategory;
    }

    try {
      const result = await CategoryService.createCategory(userId, data);
      const newCategory: Category = {
        $id: result.$id,
        userId: result.userId,
        name: result.name,
        icon: result.icon,
        color: result.color,
        type: result.type,
      };
      set((state) => ({ categories: [...state.categories, newCategory] }));
      return newCategory;
    } catch (error) {
      console.error("Add category error:", error);
      return null;
    }
  },

  updateCategory: async (categoryId, data) => {
    set((state) => ({
      categories: state.categories.map((c) =>
        c.$id === categoryId ? { ...c, ...data } : c
      ),
    }));

    if (!isOnline()) {
      enqueueOperation("categories", "update", data as Record<string, unknown>, categoryId);
      return;
    }

    try {
      await CategoryService.updateCategory(categoryId, data as Category);
    } catch (error) {
      console.error("Update category error:", error);
    }
  },

  deleteCategory: async (categoryId) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.$id !== categoryId),
    }));

    if (!isOnline()) {
      enqueueOperation("categories", "delete", {}, categoryId);
      return;
    }

    try {
      await CategoryService.deleteCategory(categoryId);
    } catch (error) {
      console.error("Delete category error:", error);
    }
  },

  getCategoryById: (id) => {
    if (!id) return undefined;
    return get().categories.find((c) => c.$id === id);
  },

  syncCategories: async () => {
    const queue = getQueue().filter((op) => op.collection === "categories");
    if (queue.length === 0 || !isOnline()) return;

    for (const op of queue) {
      try {
        if (op.action === "create") {
          await CategoryService.createCategory(op.data.userId as string, {
            name: op.data.name as string,
            icon: op.data.icon as string,
            color: op.data.color as string,
            type: op.data.type as CategoryType,
          });
        } else if (op.action === "update" && op.documentId) {
          await CategoryService.updateCategory(op.documentId, op.data as unknown as Category);
        } else if (op.action === "delete" && op.documentId) {
          await CategoryService.deleteCategory(op.documentId);
        }
        removeOperation(op.id);
      } catch (error) {
        console.error("Sync category error:", error);
      }
    }
  },
}));
