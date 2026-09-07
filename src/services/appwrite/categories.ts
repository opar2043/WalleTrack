import { DEMO_CATEGORIES } from "../../data";
import type { Category, CategoryType } from "@t/index";

export interface CategoryDoc extends Category {
  $id: string;
}

// In-memory store so create/update/delete reflect immediately in the UI
// during the demo session. Resets to the seed data on app restart.
const store: CategoryDoc[] = (DEMO_CATEGORIES as unknown as CategoryDoc[]).map(
  (c) => ({ ...c })
);

export async function getCategories(
  userId: string
): Promise<CategoryDoc[]> {
  return store.map((c) => ({ ...c }));
}

export async function createCategory(
  userId: string,
  data: {
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }
): Promise<CategoryDoc> {
  const category: CategoryDoc = {
    $id: `cat_${Date.now()}`,
    userId,
    name: data.name,
    icon: data.icon,
    color: data.color,
    type: data.type,
  };
  store.push(category);
  return { ...category };
}

export async function updateCategory(
  categoryId: string,
  data: Partial<{
    name: string;
    icon: string;
    color: string;
    type: CategoryType;
  }>
): Promise<void> {
  const index = store.findIndex((c) => c.$id === categoryId);
  if (index === -1) return;
  store[index] = { ...store[index], ...data };
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const index = store.findIndex((c) => c.$id === categoryId);
  if (index !== -1) store.splice(index, 1);
}